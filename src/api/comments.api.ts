import http from './http';
import { buildQueryString } from '@/utils';
import type {
  Comment,
  CommentWithUser,
  CreateCommentRequest,
  UpdateCommentRequest,
  PaginatedResponse,
} from '@/types';

export const commentsApi = {
  /**
   * Get comments for a task
   */
  async getAll(
    taskId: string,
    query?: { page?: number; pageSize?: number }
  ): Promise<PaginatedResponse<CommentWithUser>> {
    const queryString = query ? `?${buildQueryString(query)}` : '';
    const response = await http.get<PaginatedResponse<CommentWithUser>>(
      `/tasks/${taskId}/comments${queryString}`
    );
    return response.data;
  },

  /**
   * Create new comment
   */
  async create(taskId: string, data: CreateCommentRequest): Promise<Comment> {
    const response = await http.post<Comment>(`/tasks/${taskId}/comments`, data);
    return response.data;
  },

  /**
   * Update comment
   */
  async update(taskId: string, commentId: string, data: UpdateCommentRequest): Promise<Comment> {
    const response = await http.put<Comment>(`/tasks/${taskId}/comments/${commentId}`, data);
    return response.data;
  },

  /**
   * Delete comment
   */
  async delete(taskId: string, commentId: string): Promise<void> {
    await http.delete(`/tasks/${taskId}/comments/${commentId}`);
  },
};
