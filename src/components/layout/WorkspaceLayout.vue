<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useAuthStore } from '@/stores/auth.store';
import { useNotificationsStore } from '@/stores/notifications.store';
import NxAvatar from '@/components/ui/NxAvatar.vue';
import NxDropdown from '@/components/ui/NxDropdown.vue';
import NxSpinner from '@/components/ui/NxSpinner.vue';

const route = useRoute();
const router = useRouter();
const workspaceStore = useWorkspaceStore();
const authStore = useAuthStore();

const notificationsStore = useNotificationsStore();
const workspaceId = computed(() => route.params.workspaceId as string);

const navigation = [
  {
    name: 'Dashboard',
    to: { name: 'workspaceDashboard' },
    icon: 'dashboard',
  },
  {
    name: 'Projects',
    to: { name: 'workspaceProjects' },
    icon: 'folder',
  },
  {
    name: 'Members',
    to: { name: 'workspaceMembers' },
    icon: 'users',
  },
  {
    name: 'Labels',
    to: { name: 'workspaceLabels' },
    icon: 'tag',
  },
  {
    name: 'Activity',
    to: { name: 'workspaceActivity' },
    icon: 'activity',
  },
  {
    name: 'Settings',
    to: { name: 'workspaceSettings' },
    icon: 'settings',
  },
];

function isActive(routeName: string): boolean {
  return route.name === routeName;
}

async function loadWorkspace() {
  if (workspaceId.value) {
    try {
      await workspaceStore.setCurrentWorkspace(
        workspaceId.value,
        authStore.user?.id
      );
    } catch (error) {
      console.error('Failed to load workspace:', error);
      router.push('/');
    }
  }
}

onMounted(() => {
  loadWorkspace();
  notificationsStore.fetchUnreadCount();
});

watch(workspaceId, loadWorkspace);

async function handleLogout() {
  await authStore.logout();
  router.push('/login');
}

function goToUserSettings() {
  router.push({ name: 'userSettings' });
}

function goToNotifications() {
  router.push({ name: 'notifications' });
}

function goHome() {
  router.push('/');
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Loading state -->
    <div
      v-if="workspaceStore.isLoading && !workspaceStore.currentWorkspace"
      class="flex items-center justify-center min-h-screen"
    >
      <NxSpinner size="lg" />
    </div>

    <template v-else>
      <!-- Sidebar -->
      <aside
        class="fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800
               border-r border-gray-200 dark:border-gray-700"
      >
        <!-- Workspace header -->
        <div class="h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
          <button
            class="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            @click="goHome"
          >
            <div class="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <span class="text-white font-bold text-sm">
                {{ workspaceStore.currentWorkspace?.name.charAt(0).toUpperCase() || 'N' }}
              </span>
            </div>
            <span class="font-semibold text-gray-900 dark:text-white truncate max-w-[160px]">
              {{ workspaceStore.currentWorkspace?.name || 'NexusFlow' }}
            </span>
          </button>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-3 py-4 space-y-1">
          <RouterLink
            v-for="item in navigation"
            :key="item.name"
            :to="{ ...item.to, params: { workspaceId } }"
            :class="[
              'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive(item.to.name as string)
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            ]"
          >
            <!-- Dashboard icon -->
            <svg
              v-if="item.icon === 'dashboard'"
              class="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
            <!-- Folder icon -->
            <svg
              v-if="item.icon === 'folder'"
              class="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <!-- Users icon -->
            <svg
              v-if="item.icon === 'users'"
              class="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <!-- Tag icon -->
            <svg
              v-if="item.icon === 'tag'"
              class="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            <!-- Activity icon -->
            <svg
              v-if="item.icon === 'activity'"
              class="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <!-- Settings icon -->
            <svg
              v-if="item.icon === 'settings'"
              class="w-5 h-5 mr-3"
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
            {{ item.name }}
          </RouterLink>
        </nav>

        <!-- User section -->
        <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <NxDropdown class="relative w-full">
            <template #trigger>
              <button
                class="flex items-center w-full px-2 py-2 rounded-lg
                       hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <NxAvatar
                  :src="authStore.user?.avatar"
                  :name="authStore.user?.fullName"
                  size="sm"
                />
                <div class="ml-3 flex-1 text-left min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {{ authStore.user?.fullName || 'User' }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {{ authStore.user?.email }}
                  </p>
                </div>
                <svg
                  class="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </template>

            <template #content>
              <div
                class="absolute bottom-full left-0 mb-16 w-full min-w-[200px] 
                  bg-white dark:bg-gray-800 rounded-lg shadow-lg 
                  border border-gray-200 dark:border-gray-700 py-1 z-50"
              >
                <button
                  class="flex items-center bottom-full w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300
                         hover:bg-gray-100 dark:hover:bg-gray-700 min-w-50"
                  @click="goToUserSettings"
                >
                  <svg
                    class="w-4 h-4 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Account Settings
                </button>
                <button
                  class="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300
                         hover:bg-gray-100 dark:hover:bg-gray-700"
                  @click="goToNotifications"
                >
                  <svg
                    class="w-4 h-4 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  Notifications
                </button>
                <hr class="my-1 border-gray-200 dark:border-gray-700">
                <button
                  class="flex items-center w-full px-4 py-2 text-sm text-danger-600 dark:text-danger-400
                         hover:bg-gray-100 dark:hover:bg-gray-700"
                  @click="handleLogout"
                >
                  <svg
                    class="w-4 h-4 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Log out
                </button>
              </div>
            </template>
          </NxDropdown>
        </div>
      </aside>

      <!-- Main content -->
      <main class="pl-64">
        <!-- Top header -->
        <header
          class="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700
                 flex items-center justify-between px-6"
        >
          <!-- Page title / breadcrumb area -->
          <div>
            <slot name="header">
              <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
                {{ $route.meta.title || 'Dashboard' }}
              </h1>
            </slot>
          </div>

          <!-- Right side actions -->
          <div class="flex items-center space-x-4">
            <!-- Search -->
            <div class="relative">
              <input
                type="text"
                placeholder="Search..."
                class="w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white
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

            <!-- Notifications -->
            <button
              class="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                     rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              @click="goToNotifications"
            >
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <!-- Unread badge -->
              <span
                v-if="notificationsStore.hasUnread"
                class="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center
                       bg-danger-500 text-white text-[10px] font-bold rounded-full leading-none"
              >
                {{ notificationsStore.unreadBadge }}
              </span>
            </button>
          </div>
        </header>

        <!-- Page content -->
        <div class="p-6">
          <slot />
        </div>
      </main>
    </template>
  </div>
</template>
