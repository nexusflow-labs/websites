import http from './http';
import type { Label, CreateLabelRequest, UpdateLabelRequest } from '@/types';

export const labelsApi = {
  /**
   * Get all labels for workspace
   */
  async getAll(workspaceId: string): Promise<Label[]> {
    const response = await http.get<Label[]>(`/workspaces/${workspaceId}/labels`);
    return response.data;
  },

  /**
   * Create new label
   */
  async create(workspaceId: string, data: CreateLabelRequest): Promise<Label> {
    const response = await http.post<Label>(`/workspaces/${workspaceId}/labels`, data);
    return response.data;
  },

  /**
   * Update label
   */
  async update(workspaceId: string, labelId: string, data: UpdateLabelRequest): Promise<Label> {
    const response = await http.put<Label>(`/workspaces/${workspaceId}/labels/${labelId}`, data);
    return response.data;
  },

  /**
   * Delete label
   */
  async delete(workspaceId: string, labelId: string): Promise<void> {
    await http.delete(`/workspaces/${workspaceId}/labels/${labelId}`);
  },

  /**
   * Get labels for a task
   */
  async getTaskLabels(taskId: string): Promise<Label[]> {
    const response = await http.get<Label[]>(`/tasks/${taskId}/labels`);
    return response.data;
  },

  /**
   * Add label to task
   */
  async addToTask(taskId: string, labelId: string): Promise<void> {
    await http.post(`/tasks/${taskId}/labels/${labelId}`);
  },

  /**
   * Remove label from task
   */
  async removeFromTask(taskId: string, labelId: string): Promise<void> {
    await http.delete(`/tasks/${taskId}/labels/${labelId}`);
  },
};
