import http from './http';
import { buildQueryString } from '@/utils';
import type { ActivityLog, ListActivityLogsQuery, PaginatedResponse } from '@/types';

export const activityApi = {
  /**
   * Get activity logs with filters
   */
  async getAll(query?: ListActivityLogsQuery): Promise<PaginatedResponse<ActivityLog>> {
    const queryString = query ? `?${buildQueryString(query)}` : '';
    const response = await http.get<PaginatedResponse<ActivityLog>>(
      `/activity-logs${queryString}`
    );
    return response.data;
  },

  /**
   * Get activity logs for a task
   */
  async getForTask(
    taskId: string,
    query?: ListActivityLogsQuery
  ): Promise<PaginatedResponse<ActivityLog>> {
    const queryString = query ? `?${buildQueryString(query)}` : '';
    const response = await http.get<PaginatedResponse<ActivityLog>>(
      `/activity-logs/tasks/${taskId}${queryString}`
    );
    return response.data;
  },

  /**
   * Get activity logs for a project
   */
  async getForProject(
    projectId: string,
    query?: ListActivityLogsQuery
  ): Promise<PaginatedResponse<ActivityLog>> {
    const queryString = query ? `?${buildQueryString(query)}` : '';
    const response = await http.get<PaginatedResponse<ActivityLog>>(
      `/activity-logs/projects/${projectId}${queryString}`
    );
    return response.data;
  },

  /**
   * Get activity logs for a workspace
   */
  async getForWorkspace(
    workspaceId: string,
    query?: ListActivityLogsQuery
  ): Promise<PaginatedResponse<ActivityLog>> {
    const queryString = query ? `?${buildQueryString(query)}` : '';
    const response = await http.get<PaginatedResponse<ActivityLog>>(
      `/activity-logs/workspaces/${workspaceId}${queryString}`
    );
    console.log(response.data);
    return response.data;
  },
};
