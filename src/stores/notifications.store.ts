import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { notificationsApi } from '@/api/notifications.api';
import { getErrorMessage } from '@/api/http';
import type { Notification } from '@/types';

export const useNotificationsStore = defineStore('notifications', () => {
  // State
  const notifications = ref<Notification[]>([]);
  const unreadCount = ref(0);
  const nextCursor = ref<string | undefined>(undefined);
  const hasNextPage = ref(false);
  const isLoading = ref(false);
  const isLoadingMore = ref(false);
  const error = ref<string | null>(null);
  const currentFilter = ref<'all' | 'unread' | 'read'>('all');

  // Getters
  const hasUnread = computed(() => unreadCount.value > 0);
  const unreadBadge = computed(() => {
    if (unreadCount.value === 0) return null;
    return unreadCount.value > 99 ? '99+' : String(unreadCount.value);
  });

  // Actions
  async function fetchNotifications(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    nextCursor.value = undefined;

    try {
      const response = await notificationsApi.getAll({
        filter: currentFilter.value,
        limit: 20,
      });
      notifications.value = response.items;
      nextCursor.value = response.meta.nextCursor;
      hasNextPage.value = response.meta.hasNextPage;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function loadMore(): Promise<void> {
    if (!hasNextPage.value || isLoadingMore.value) return;

    isLoadingMore.value = true;
    try {
      const response = await notificationsApi.getAll({
        filter: currentFilter.value,
        cursor: nextCursor.value,
        limit: 20,
      });
      notifications.value.push(...response.items);
      nextCursor.value = response.meta.nextCursor;
      hasNextPage.value = response.meta.hasNextPage;
    } catch (err) {
      error.value = getErrorMessage(err);
    } finally {
      isLoadingMore.value = false;
    }
  }

  async function fetchUnreadCount(): Promise<void> {
    try {
      unreadCount.value = await notificationsApi.getUnreadCount();
    } catch {
      // silent
    }
  }

  async function markAsRead(notificationId: string): Promise<void> {
    try {
      const updated = await notificationsApi.markAsRead(notificationId);
      const index = notifications.value.findIndex((n) => n.id === notificationId);
      if (index !== -1) {
        notifications.value[index] = updated;
      }
      if (unreadCount.value > 0) {
        unreadCount.value--;
      }
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    }
  }

  async function markAllAsRead(): Promise<void> {
    try {
      await notificationsApi.markAllAsRead();
      notifications.value = notifications.value.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }));
      unreadCount.value = 0;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    }
  }

  function setFilter(filter: 'all' | 'unread' | 'read'): void {
    currentFilter.value = filter;
  }

  function addNotification(notification: Notification): void {
    notifications.value.unshift(notification);
    if (!notification.isRead) {
      unreadCount.value++;
    }
  }

  function reset(): void {
    notifications.value = [];
    unreadCount.value = 0;
    nextCursor.value = undefined;
    hasNextPage.value = false;
    isLoading.value = false;
    isLoadingMore.value = false;
    error.value = null;
    currentFilter.value = 'all';
  }

  return {
    // State
    notifications,
    unreadCount,
    nextCursor,
    hasNextPage,
    isLoading,
    isLoadingMore,
    error,
    currentFilter,

    // Getters
    hasUnread,
    unreadBadge,

    // Actions
    fetchNotifications,
    loadMore,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    setFilter,
    addNotification,
    reset,
  };
});
