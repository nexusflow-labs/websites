<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useNotificationsStore } from '@/stores/notifications.store';
import { useAuthStore } from '@/stores/auth.store';
import NxSpinner from '@/components/ui/NxSpinner.vue';
import NxButton from '@/components/ui/NxButton.vue';
import NxAvatar from '@/components/ui/NxAvatar.vue';
import type { Notification, NotificationType } from '@/types';
import { formatDistanceToNow } from 'date-fns';

const router = useRouter();
const notificationsStore = useNotificationsStore();
const authStore = useAuthStore();

const filterTabs: { label: string; value: 'all' | 'unread' | 'read' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
  { label: 'Read', value: 'read' },
];

function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case 'TASK_ASSIGNED': return 'assign';
    case 'COMMENT_ADDED': return 'comment';
    case 'MEMBER_ADDED': return 'member';
    case 'MEMBER_REMOVED': return 'member-remove';
    case 'TASK_UPDATED': return 'task';
    default: return 'bell';
  }
}

function getIconBgClass(type: NotificationType): string {
  switch (type) {
    case 'TASK_ASSIGNED': return 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400';
    case 'COMMENT_ADDED': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
    case 'MEMBER_ADDED': return 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400';
    case 'MEMBER_REMOVED': return 'bg-danger-100 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400';
    case 'TASK_UPDATED': return 'bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400';
    default: return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
  }
}

function formatTime(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

async function handleFilterChange(filter: 'all' | 'unread' | 'read') {
  notificationsStore.setFilter(filter);
  await notificationsStore.fetchNotifications();
}

async function handleMarkAsRead(notification: Notification) {
  if (!notification.isRead) {
    await notificationsStore.markAsRead(notification.id);
  }
}

async function handleMarkAllAsRead() {
  await notificationsStore.markAllAsRead();
}

function goBack() {
  router.back();
}

onMounted(async () => {
  await notificationsStore.fetchNotifications();
});

watch(() => authStore.isAuthenticated, (val) => {
  if (!val) router.push('/login');
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-3xl mx-auto px-4 py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center space-x-4">
          <button
            class="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100
                   dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
            @click="goBack"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
            <p v-if="notificationsStore.unreadCount > 0" class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {{ notificationsStore.unreadCount }} unread
            </p>
          </div>
        </div>

        <NxButton
          v-if="notificationsStore.hasUnread"
          variant="ghost"
          size="sm"
          @click="handleMarkAllAsRead"
        >
          Mark all as read
        </NxButton>
      </div>

      <!-- Filter tabs -->
      <div class="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
        <button
          v-for="tab in filterTabs"
          :key="tab.value"
          :class="[
            'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors',
            notificationsStore.currentFilter === tab.value
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          ]"
          @click="handleFilterChange(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Loading state -->
      <div v-if="notificationsStore.isLoading" class="flex justify-center py-16">
        <NxSpinner size="lg" />
      </div>

      <!-- Empty state -->
      <div
        v-else-if="notificationsStore.notifications.length === 0"
        class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-16 text-center"
      >
        <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <p class="text-gray-500 dark:text-gray-400 font-medium">No notifications</p>
        <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">
          {{ notificationsStore.currentFilter === 'unread' ? "You're all caught up!" : 'Nothing here yet.' }}
        </p>
      </div>

      <!-- Notifications list -->
      <div
        v-else
        class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden"
      >
        <div
          v-for="notification in notificationsStore.notifications"
          :key="notification.id"
          :class="[
            'flex items-start p-4 gap-4 transition-colors cursor-pointer',
            notification.isRead
              ? 'hover:bg-gray-50 dark:hover:bg-gray-750'
              : 'bg-primary-50/50 dark:bg-primary-900/10 hover:bg-primary-50 dark:hover:bg-primary-900/20'
          ]"
          @click="handleMarkAsRead(notification)"
        >
          <!-- Icon -->
          <div :class="['w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', getIconBgClass(notification.type)]">
            <!-- Assign icon -->
            <svg v-if="getNotificationIcon(notification.type) === 'assign'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <!-- Comment icon -->
            <svg v-else-if="getNotificationIcon(notification.type) === 'comment'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <!-- Member add icon -->
            <svg v-else-if="getNotificationIcon(notification.type) === 'member'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <!-- Member remove icon -->
            <svg v-else-if="getNotificationIcon(notification.type) === 'member-remove'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
            </svg>
            <!-- Task update icon -->
            <svg v-else-if="getNotificationIcon(notification.type) === 'task'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <!-- Default bell -->
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ notification.title }}</p>
            <p v-if="notification.message" class="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
              {{ notification.message }}
            </p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {{ formatTime(notification.createdAt) }}
            </p>
          </div>

          <!-- Unread dot -->
          <div
            v-if="!notification.isRead"
            class="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-2"
          />
        </div>
      </div>

      <!-- Load more -->
      <div v-if="notificationsStore.hasNextPage" class="mt-4 flex justify-center">
        <NxButton
          variant="ghost"
          :loading="notificationsStore.isLoadingMore"
          @click="notificationsStore.loadMore()"
        >
          Load more
        </NxButton>
      </div>
    </div>
  </div>
</template>
