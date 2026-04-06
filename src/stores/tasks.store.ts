import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { tasksApi } from '@/api/tasks.api';
import { labelsApi } from '@/api/labels.api';
import { getErrorMessage } from '@/api/http';
import type {
  Task,
  TaskWithDetails,
  TaskStatus,
  TaskPriority,
  CreateTaskRequest,
  UpdateTaskRequest,
  AssignTaskRequest,
  ListTasksQuery,
  PaginationMeta,
  Label,
} from '@/types';

export interface TaskFilters {
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  labelIds?: string;
  overdue?: boolean;
  dueDateFrom?: string;
  dueDateTo?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'title' | 'position';
  sortDirection?: 'asc' | 'desc';
}

export const useTasksStore = defineStore('tasks', () => {
  // State
  const tasks = ref<Task[]>([]);
  const currentTask = ref<TaskWithDetails | null>(null);
  const currentTaskLabels = ref<Label[]>([]);
  const subtasks = ref<Task[]>([]);
  const pagination = ref<PaginationMeta>({
    page: 1,
    pageSize: 100,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const filters = ref<TaskFilters>({
    sortBy: 'createdAt',
    sortDirection: 'desc',
  });
  const isLoading = ref(false);
  const isLoadingTask = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const tasksByStatus = computed(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      TODO: [],
      IN_PROGRESS: [],
      IN_REVIEW: [],
      DONE: [],
    };

    tasks.value.forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });

    return grouped;
  });

  const todoTasks = computed(() => tasksByStatus.value.TODO);
  const inProgressTasks = computed(() => tasksByStatus.value.IN_PROGRESS);
  const inReviewTasks = computed(() => tasksByStatus.value.IN_REVIEW);
  const doneTasks = computed(() => tasksByStatus.value.DONE);

  const hasTasks = computed(() => tasks.value.length > 0);

  const overdueTasks = computed(() =>
    tasks.value.filter((task) => {
      if (!task.dueDate || task.status === 'DONE') return false;
      return new Date(task.dueDate) < new Date();
    })
  );

  const taskCountByPriority = computed(() => {
    const counts: Record<TaskPriority, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0,
    };
    tasks.value.forEach((task) => {
      counts[task.priority]++;
    });
    return counts;
  });

  // Actions
  async function fetchTasks(
    projectId: string,
    query?: ListTasksQuery
  ): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const mergedQuery: ListTasksQuery = {
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        rootOnly: true,
        ...filters.value,
        ...query,
      };

      const response = await tasksApi.getAll(projectId, mergedQuery);
      tasks.value = response.items;
      pagination.value = response.meta;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchTask(projectId: string, taskId: string): Promise<void> {
    isLoadingTask.value = true;
    error.value = null;

    try {
      const [task, labels] = await Promise.all([
        tasksApi.getById(projectId, taskId),
        labelsApi.getTaskLabels(taskId),
      ]);

      currentTask.value = {
        ...task,
        labels,
        creator: { id: task.creatorId } as any,
      };
      currentTaskLabels.value = labels;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isLoadingTask.value = false;
    }
  }

  async function fetchSubtasks(projectId: string, taskId: string): Promise<void> {
    try {
      subtasks.value = await tasksApi.getSubtasks(projectId, taskId);
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    }
  }

  async function createTask(
    projectId: string,
    data: CreateTaskRequest
  ): Promise<Task> {
    isLoading.value = true;
    error.value = null;

    try {
      const task = await tasksApi.create(projectId, data);

      // If it's a subtask, add to subtasks array
      if (data.parentId) {
        subtasks.value.push(task);
      } else {
        // Add to main tasks list
        tasks.value.unshift(task);
        pagination.value.totalItems++;
      }

      return task;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateTask(
    projectId: string,
    taskId: string,
    data: UpdateTaskRequest
  ): Promise<Task> {
    error.value = null;

    try {
      const updated = await tasksApi.update(projectId, taskId, data);

      // Update in tasks list
      const index = tasks.value.findIndex((t) => t.id === taskId);
      if (index !== -1) {
        tasks.value[index] = updated;
      }

      // Update in subtasks list
      const subtaskIndex = subtasks.value.findIndex((t) => t.id === taskId);
      if (subtaskIndex !== -1) {
        subtasks.value[subtaskIndex] = updated;
      }

      // Update current task if same
      if (currentTask.value?.id === taskId) {
        currentTask.value = {
          ...currentTask.value,
          ...updated,
        };
      }

      return updated;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    }
  }

  async function assignTask(
    projectId: string,
    taskId: string,
    data: AssignTaskRequest
  ): Promise<Task> {
    error.value = null;

    try {
      const updated = await tasksApi.assign(projectId, taskId, data);

      // Update in list
      const index = tasks.value.findIndex((t) => t.id === taskId);
      if (index !== -1) {
        tasks.value[index] = updated;
      }

      // Update current if same
      if (currentTask.value?.id === taskId) {
        currentTask.value = {
          ...currentTask.value,
          ...updated,
        };
      }

      return updated;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    }
  }

  async function deleteTask(projectId: string, taskId: string): Promise<void> {
    error.value = null;

    try {
      await tasksApi.delete(projectId, taskId);

      // Remove from tasks list
      tasks.value = tasks.value.filter((t) => t.id !== taskId);
      pagination.value.totalItems--;

      // Remove from subtasks list
      subtasks.value = subtasks.value.filter((t) => t.id !== taskId);

      if (currentTask.value?.id === taskId) {
        currentTask.value = null;
      }
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    }
  }

  // Label management for tasks
  async function addLabelToTask(taskId: string, labelId: string): Promise<void> {
    try {
      await labelsApi.addToTask(taskId, labelId);
      // Refresh labels for current task
      if (currentTask.value?.id === taskId) {
        currentTaskLabels.value = await labelsApi.getTaskLabels(taskId);
        currentTask.value.labels = currentTaskLabels.value;
      }
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    }
  }

  async function removeLabelFromTask(taskId: string, labelId: string): Promise<void> {
    try {
      await labelsApi.removeFromTask(taskId, labelId);
      // Remove from current task labels
      if (currentTask.value?.id === taskId) {
        currentTaskLabels.value = currentTaskLabels.value.filter((l) => l.id !== labelId);
        currentTask.value.labels = currentTaskLabels.value;
      }
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    }
  }

  // Optimistic status update
  function updateTaskStatusOptimistic(taskId: string, status: TaskStatus): void {
    const index = tasks.value.findIndex((t) => t.id === taskId);
    if (index !== -1) {
      tasks.value[index] = { ...tasks.value[index], status };
    }
  }

  function revertTaskStatus(taskId: string, status: TaskStatus): void {
    const index = tasks.value.findIndex((t) => t.id === taskId);
    if (index !== -1) {
      tasks.value[index] = { ...tasks.value[index], status };
    }
  }

  function setFilters(newFilters: TaskFilters): void {
    filters.value = { ...filters.value, ...newFilters };
  }

  function clearFilters(): void {
    filters.value = {
      sortBy: 'createdAt',
      sortDirection: 'desc',
    };
  }

  function setPage(page: number): void {
    pagination.value.page = page;
  }

  function setPageSize(pageSize: number): void {
    pagination.value.pageSize = pageSize;
    pagination.value.page = 1;
  }

  function setCurrentTask(task: TaskWithDetails | null): void {
    currentTask.value = task;
    if (task) {
      currentTaskLabels.value = task.labels || [];
    } else {
      currentTaskLabels.value = [];
      subtasks.value = [];
    }
  }

  function clearError(): void {
    error.value = null;
  }

  function reset(): void {
    tasks.value = [];
    currentTask.value = null;
    currentTaskLabels.value = [];
    subtasks.value = [];
    pagination.value = {
      page: 1,
      pageSize: 100,
      totalItems: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    };
    filters.value = {
      sortBy: 'createdAt',
      sortDirection: 'desc',
    };
    isLoading.value = false;
    isLoadingTask.value = false;
    error.value = null;
  }

  return {
    // State
    tasks,
    currentTask,
    currentTaskLabels,
    subtasks,
    pagination,
    filters,
    isLoading,
    isLoadingTask,
    error,

    // Getters
    tasksByStatus,
    todoTasks,
    inProgressTasks,
    inReviewTasks,
    doneTasks,
    hasTasks,
    overdueTasks,
    taskCountByPriority,

    // Actions
    fetchTasks,
    fetchTask,
    fetchSubtasks,
    createTask,
    updateTask,
    assignTask,
    deleteTask,
    addLabelToTask,
    removeLabelFromTask,
    updateTaskStatusOptimistic,
    revertTaskStatus,
    setFilters,
    clearFilters,
    setPage,
    setPageSize,
    setCurrentTask,
    clearError,
    reset,
  };
});
