import http from './http';
import { buildQueryString } from '@/utils';
import type {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  AssignTaskRequest,
  ListTasksQuery,
  PaginatedResponse,
} from '@/types';

export const tasksApi = {
  /**
   * Get tasks list with pagination and filters
   */
  async getAll(projectId: string, query?: ListTasksQuery): Promise<PaginatedResponse<Task>> {
    const queryString = query ? `?${buildQueryString(query)}` : '';
    const response = await http.get<PaginatedResponse<Task>>(
      `/projects/${projectId}/tasks${queryString}`
    );
    return response.data;
  },

  /**
   * Get task by ID
   */
  async getById(projectId: string, taskId: string): Promise<Task> {
    const response = await http.get<Task>(`/projects/${projectId}/tasks/${taskId}`);
    return response.data;
  },

  /**
   * Get subtasks of a task
   */
  async getSubtasks(projectId: string, taskId: string): Promise<Task[]> {
    const response = await http.get<Task[]>(`/projects/${projectId}/tasks/${taskId}/subtasks`);
    return response.data;
  },

  /**
   * Create new task
   */
  async create(projectId: string, data: CreateTaskRequest): Promise<Task> {
    const response = await http.post<Task>(`/projects/${projectId}/tasks`, data);
    return response.data;
  },

  /**
   * Update task
   */
  async update(projectId: string, taskId: string, data: UpdateTaskRequest): Promise<Task> {
    const response = await http.put<Task>(`/projects/${projectId}/tasks/${taskId}`, data);
    return response.data;
  },

  /**
   * Assign task to user
   */
  async assign(projectId: string, taskId: string, data: AssignTaskRequest): Promise<Task> {
    const response = await http.patch<Task>(`/projects/${projectId}/tasks/${taskId}/assign`, data);
    return response.data;
  },

  /**
   * Delete task
   */
  async delete(projectId: string, taskId: string): Promise<void> {
    await http.delete(`/projects/${projectId}/tasks/${taskId}`);
  },
};
