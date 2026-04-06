import http from './http';
import { buildQueryString } from '@/utils';
import type {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  ListProjectsQuery,
  PaginatedResponse,
} from '@/types';

export const projectsApi = {
  /**
   * Get projects list with pagination and filters
   */
  async getAll(
    workspaceId: string,
    query?: ListProjectsQuery
  ): Promise<PaginatedResponse<Project>> {
    const queryString = query ? `?${buildQueryString(query)}` : '';
    const response = await http.get<PaginatedResponse<Project>>(
      `/workspaces/${workspaceId}/projects${queryString}`
    );
    return response.data;
  },

  /**
   * Get project by ID
   */
  async getById(workspaceId: string, projectId: string): Promise<Project> {
    const response = await http.get<Project>(`/workspaces/${workspaceId}/projects/${projectId}`);
    return response.data;
  },

  /**
   * Create new project
   */
  async create(workspaceId: string, data: CreateProjectRequest): Promise<Project> {
    const response = await http.post<Project>(`/workspaces/${workspaceId}/projects`, data);
    return response.data;
  },

  /**
   * Update project
   */
  async update(
    workspaceId: string,
    projectId: string,
    data: UpdateProjectRequest
  ): Promise<Project> {
    const response = await http.put<Project>(
      `/workspaces/${workspaceId}/projects/${projectId}`,
      data
    );
    return response.data;
  },

  /**
   * Delete project
   */
  async delete(workspaceId: string, projectId: string): Promise<void> {
    await http.delete(`/workspaces/${workspaceId}/projects/${projectId}`);
  },
};
