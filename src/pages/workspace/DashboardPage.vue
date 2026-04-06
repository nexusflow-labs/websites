<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useProjectsStore } from '@/stores/projects.store';
import { activityApi } from '@/api/activity.api';
import WorkspaceLayout from '@/components/layout/WorkspaceLayout.vue';
import NxSpinner from '@/components/ui/NxSpinner.vue';
import NxBadge from '@/components/ui/NxBadge.vue';
import NxAvatar from '@/components/ui/NxAvatar.vue';
import type { ActivityLog } from '@/types';
import { formatDistanceToNow } from 'date-fns';

const route = useRoute();
const workspaceStore = useWorkspaceStore();
const projectsStore = useProjectsStore();

const workspaceId = computed(() => route.params.workspaceId as string);
const activityLogs = ref<ActivityLog[]>([]);
const isLoadingActivity = ref(false);

// Stats from stores
const projectCount = computed(() => projectsStore.projects.length);
const activeProjectCount = computed(() => projectsStore.activeProjects.length);
const memberCount = computed(() => workspaceStore.members.length);

const stats = computed(() => [
  {
    label: 'Total Projects',
    value: projectCount.value,
    icon: 'folder',
    iconBg: 'bg-primary-100 dark:bg-primary-900/30',
    iconColor: 'text-primary-600 dark:text-primary-400',
    sub: `${activeProjectCount.value} active`,
  },
  {
    label: 'Members',
    value: memberCount.value,
    icon: 'users',
    iconBg: 'bg-warning-100 dark:bg-warning-900/30',
    iconColor: 'text-warning-600 dark:text-warning-400',
    sub: null,
  },
  {
    label: 'Completed',
    value: projectsStore.completedProjects.length,
    icon: 'check',
    iconBg: 'bg-success-100 dark:bg-success-900/30',
    iconColor: 'text-success-600 dark:text-success-400',
    sub: `${projectsStore.archivedProjects.length} archived`,
  },
]);

function getActivityLabel(log: ActivityLog): string {
  const action = log.action === 'CREATE' ? 'created' : log.action === 'UPDATE' ? 'updated' : 'deleted';
  const entity = log.entityType.toLowerCase();
  return `${action} a ${entity}`;
}

function getActivityIcon(log: ActivityLog): string {
  switch (log.entityType) {
    case 'TASK': return 'task';
    case 'PROJECT': return 'folder';
    case 'COMMENT': return 'comment';
    case 'MEMBER': return 'user';
    default: return 'activity';
  }
}

function getActivityIconClass(log: ActivityLog): string {
  switch (log.action) {
    case 'CREATE': return 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400';
    case 'UPDATE': return 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400';
    case 'DELETE': return 'bg-danger-100 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400';
    default: return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
  }
}

function formatTime(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

function getProjectStatusVariant(status: string): 'default' | 'primary' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'ACTIVE': return 'success';
    case 'COMPLETED': return 'primary';
    case 'ARCHIVED': return 'default';
    default: return 'default';
  }
}

async function loadData() {
  if (!workspaceId.value) return;

  await projectsStore.fetchProjects(workspaceId.value);

  isLoadingActivity.value = true;
  try {
    const response = await activityApi.getForWorkspace(workspaceId.value, { pageSize: 15 });
    activityLogs.value = response.items;
  } catch {
    // activity is non-critical
  } finally {
    isLoadingActivity.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <WorkspaceLayout>
    <template #header>
      <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
    </template>

    <div class="space-y-6">
      <!-- Welcome section -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Welcome to {{ workspaceStore.currentWorkspace?.name || 'your workspace' }}
        </h2>
        <p class="text-gray-500 dark:text-gray-400 text-sm">
          {{ workspaceStore.currentWorkspace?.description || 'Manage your projects and collaborate with your team.' }}
        </p>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div class="flex items-center">
            <div :class="['w-12 h-12 rounded-lg flex items-center justify-center', stat.iconBg]">
              <!-- Folder -->
              <svg v-if="stat.icon === 'folder'" :class="['w-6 h-6', stat.iconColor]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <!-- Users -->
              <svg v-else-if="stat.icon === 'users'" :class="['w-6 h-6', stat.iconColor]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <!-- Check -->
              <svg v-else-if="stat.icon === 'check'" :class="['w-6 h-6', stat.iconColor]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ stat.label }}</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ projectsStore.isLoading && stat.icon === 'folder' ? '-' : stat.value }}
              </p>
              <p v-if="stat.sub" class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{{ stat.sub }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Main content grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Recent Projects -->
        <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 class="font-semibold text-gray-900 dark:text-white">Recent Projects</h3>
            <button
              class="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              @click="$router.push({ name: 'workspaceProjects', params: { workspaceId } })"
            >
              View all
            </button>
          </div>

          <div v-if="projectsStore.isLoading" class="flex justify-center py-12">
            <NxSpinner />
          </div>

          <div v-else-if="projectsStore.projects.length === 0" class="px-6 py-12 text-center">
            <p class="text-gray-400 dark:text-gray-500 text-sm">No projects yet</p>
            <button
              class="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
              @click="$router.push({ name: 'workspaceProjects', params: { workspaceId } })"
            >
              Create your first project
            </button>
          </div>

          <ul v-else class="divide-y divide-gray-100 dark:divide-gray-700">
            <li
              v-for="project in projectsStore.projects.slice(0, 6)"
              :key="project.id"
              class="flex items-center px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition-colors"
              @click="$router.push({ name: 'project', params: { workspaceId, projectId: project.id } })"
            >
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style="background-color: #6366f1"
              >
                {{ project.name.charAt(0).toUpperCase() }}
              </div>
              <div class="ml-3 flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ project.name }}</p>
                <p v-if="project.description" class="text-xs text-gray-400 dark:text-gray-500 truncate">
                  {{ project.description }}
                </p>
              </div>
              <NxBadge
                :variant="getProjectStatusVariant(project.status)"
                size="sm"
              >
                {{ project.status.charAt(0) + project.status.slice(1).toLowerCase() }}
              </NxBadge>
            </li>
          </ul>
        </div>

        <!-- Team Members -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 class="font-semibold text-gray-900 dark:text-white">Team</h3>
            <button
              class="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              @click="$router.push({ name: 'workspaceMembers', params: { workspaceId } })"
            >
              View all
            </button>
          </div>

          <ul class="divide-y divide-gray-100 dark:divide-gray-700">
            <li
              v-for="member in workspaceStore.members.slice(0, 8)"
              :key="member.id"
              class="flex items-center px-6 py-3"
            >
              <NxAvatar
                :src="member.user?.avatar"
                :name="member.user?.fullName"
                size="sm"
              />
              <div class="ml-3 flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ member.user?.fullName || 'Unknown' }}
                </p>
                <p class="text-xs text-gray-400 dark:text-gray-500 truncate">{{ member.role }}</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 class="font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
        </div>

        <div v-if="isLoadingActivity" class="flex justify-center py-12">
          <NxSpinner />
        </div>

        <div v-else-if="activityLogs.length === 0" class="px-6 py-12 text-center">
          <p class="text-gray-400 dark:text-gray-500 text-sm">No recent activity</p>
        </div>

        <ul v-else class="divide-y divide-gray-100 dark:divide-gray-700">
          <li
            v-for="log in activityLogs"
            :key="log.id"
            class="flex items-start px-6 py-4 gap-4"
          >
            <!-- Icon -->
            <div :class="['w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5', getActivityIconClass(log)]">
              <svg v-if="getActivityIcon(log) === 'task'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <svg v-else-if="getActivityIcon(log) === 'folder'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <svg v-else-if="getActivityIcon(log) === 'comment'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-700 dark:text-gray-300">
                <span class="font-medium text-gray-900 dark:text-white">{{ log.user.name }}</span>
                {{ ' ' + getActivityLabel(log) }}
              </p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {{ formatTime(log.createdAt) }}
              </p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </WorkspaceLayout>
</template>
