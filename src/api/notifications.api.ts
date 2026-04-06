import http from './http';
import { buildQueryString } from '@/utils';
import type {
  Notification,
  ListNotificationsQuery,
  CursorPaginatedResponse,
  UnreadCountResponse,
} from '@/types';

export const notificationsApi = {
  /**
   * Get notifications list with cursor pagination
   */
  async getAll(query?: ListNotificationsQuery): Promise<CursorPaginatedResponse<Notification>> {
    const queryString = query ? `?${buildQueryString(query)}` : '';
    const response = await http.get<CursorPaginatedResponse<Notification>>(
      `/notifications${queryString}`
    );
    return response.data;
  },

  /**
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<number> {
    const response = await http.get<UnreadCountResponse>('/notifications/unread-count');
    return response.data.count;
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await http.patch<Notification>(`/notifications/${notificationId}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    await http.patch('/notifications/read-all');
  },
};
