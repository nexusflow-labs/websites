<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProjectsStore } from '@/stores/projects.store';
import { useToast } from '@/composables/useToast';
import { formatRelativeTime } from '@/utils';
import WorkspaceLayout from '@/components/layout/WorkspaceLayout.vue';
import NxButton from '@/components/ui/NxButton.vue';
import NxSelect from '@/components/ui/NxSelect.vue';
import NxBadge from '@/components/ui/NxBadge.vue';
import NxSpinner from '@/components/ui/NxSpinner.vue';
import NxDropdown from '@/components/ui/NxDropdown.vue';
import CreateProjectModal from '@/components/project/CreateProjectModal.vue';
import ProjectSettingsModal from '@/components/project/ProjectSettingsModal.vue';
import type { Project, ProjectStatus } from '@/types';

const route = useRoute();
const router = useRouter();
const projectsStore = useProjectsStore();
const toast = useToast();

const workspaceId = computed(() => route.params.workspaceId as string);

// View state
const viewMode = ref<'grid' | 'list'>('grid');
const searchQuery = ref('');
const statusFilter = ref<ProjectStatus | ''>('');
const sortBy = ref<'createdAt' | 'updatedAt' | 'name'>('createdAt');
const sortDirection = ref<'asc' | 'desc'>('desc');

// Modal state
const showCreateModal = ref(false);
const showSettingsModal = ref(false);
const selectedProject = ref<Project | null>(null);

// Status options for filter
const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ARCHIVED', label: 'Archived' },
];

// Sort options
const sortOptions = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'updatedAt', label: 'Last Updated' },
  { value: 'name', label: 'Name' },
];

function getStatusVariant(status: ProjectStatus): 'success' | 'warning' | 'default' | 'primary' {
  const variants: Record<ProjectStatus, 'success' | 'warning' | 'default' | 'primary'> = {
    ACTIVE: 'success',
    COMPLETED: 'primary',
    ARCHIVED: 'default',
  };
  return variants[status] || 'default';
}

function getStatusLabel(status: ProjectStatus): string {
  const labels: Record<ProjectStatus, string> = {
    ACTIVE: 'Active',
    COMPLETED: 'Completed',
    ARCHIVED: 'Archived',
  };
  return labels[status] || status;
}

async function loadProjects() {
  try {
    await projectsStore.fetchProjects(workspaceId.value, {
      search: searchQuery.value || undefined,
      status: (statusFilter.value as ProjectStatus) || undefined,
      sortBy: sortBy.value,
      sortDirection: sortDirection.value,
    });
  } catch (error) {
    toast.error('Failed to load projects');
  }
}

function navigateToProject(project: Project) {
  router.push({
    name: 'project',
    params: { workspaceId: workspaceId.value, projectId: project.id },
  });
}

function openSettings(project: Project, event: Event) {
  event.stopPropagation();
  selectedProject.value = project;
  showSettingsModal.value = true;
}

function handleProjectCreated() {
  showCreateModal.value = false;
}

function handleProjectUpdated() {
  showSettingsModal.value = false;
  selectedProject.value = null;
}

function handleProjectDeleted() {
  showSettingsModal.value = false;
  selectedProject.value = null;
}

function toggleSortDirection() {
  sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
}

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout>;
watch(searchQuery, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadProjects();
  }, 300);
});

// Watch filters and reload
watch([statusFilter, sortBy, sortDirection], () => {
  loadProjects();
});

// Load on mount
onMounted(() => {
  loadProjects();
});
</script>

<template>
  <WorkspaceLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Projects
          </h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your workspace projects
          </p>
        </div>
        <NxButton @click="showCreateModal = true">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </NxButton>
      </div>

      <!-- Filters and Controls -->
      <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div class="flex flex-1 gap-4 items-center flex-wrap">
          <!-- Search -->
          <div class="relative flex-1 min-w-[200px] max-w-md">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search projects..."
              class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     placeholder-gray-400 dark:placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <svg
              class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <!-- Status Filter -->
          <div class="w-40">
            <NxSelect
              v-model="statusFilter"
              :options="statusOptions"
              placeholder="All Statuses"
            />
          </div>

          <!-- Sort -->
          <div class="w-40">
            <NxSelect
              v-model="sortBy"
              :options="sortOptions"
            />
          </div>

          <!-- Sort Direction -->
          <button
            class="p-2 rounded-lg border border-gray-300 dark:border-gray-600
                   hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Toggle sort direction"
            @click="toggleSortDirection"
          >
            <svg
              :class="['w-5 h-5 text-gray-500 transition-transform', sortDirection === 'desc' ? 'rotate-180' : '']"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>

        <!-- View Toggle -->
        <div class="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
          <button
            :class="[
              'p-2 transition-colors',
              viewMode === 'grid'
                ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
            ]"
            title="Grid view"
            @click="viewMode = 'grid'"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            :class="[
              'p-2 transition-colors',
              viewMode === 'list'
                ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
            ]"
            title="List view"
            @click="viewMode = 'list'"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="projectsStore.isLoading" class="flex items-center justify-center py-12">
        <NxSpinner size="lg" />
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!projectsStore.hasProjects"
        class="text-center py-12 px-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700"
      >
        <svg
          class="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          No projects yet
        </h3>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Get started by creating your first project.
        </p>
        <NxButton class="mt-4" @click="showCreateModal = true">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Create Project
        </NxButton>
      </div>

      <!-- Grid View -->
      <div
        v-else-if="viewMode === 'grid'"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <div
          v-for="project in projectsStore.projects"
          :key="project.id"
          class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700
                 hover:shadow-md transition-shadow cursor-pointer"
          @click="navigateToProject(project)"
        >
          <div class="p-5">
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {{ project.name }}
                </h3>
                <p
                  v-if="project.description"
                  class="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2"
                >
                  {{ project.description }}
                </p>
              </div>
              <NxDropdown>
                <template #trigger>
                  <button
                    class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    @click.stop
                  >
                    <svg class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                  </button>
                </template>
                <template #content>
                  <div class="py-1">
                    <button
                      class="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300
                             hover:bg-gray-100 dark:hover:bg-gray-700"
                      @click="openSettings(project, $event)"
                    >
                      <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </button>
                  </div>
                </template>
              </NxDropdown>
            </div>

            <div class="mt-4 flex items-center justify-between">
              <NxBadge :variant="getStatusVariant(project.status)" :dot="true">
                {{ getStatusLabel(project.status) }}
              </NxBadge>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatRelativeTime(project.updatedAt) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- List View -->
      <div
        v-else
        class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Project
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Created
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Updated
              </th>
              <th class="relative px-6 py-3">
                <span class="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="project in projectsStore.projects"
              :key="project.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
              @click="navigateToProject(project)"
            >
              <td class="px-6 py-4">
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ project.name }}
                  </p>
                  <p
                    v-if="project.description"
                    class="text-sm text-gray-500 dark:text-gray-400 truncate max-w-md"
                  >
                    {{ project.description }}
                  </p>
                </div>
              </td>
              <td class="px-6 py-4">
                <NxBadge :variant="getStatusVariant(project.status)" :dot="true">
                  {{ getStatusLabel(project.status) }}
                </NxBadge>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                {{ formatRelativeTime(project.createdAt) }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                {{ formatRelativeTime(project.updatedAt) }}
              </td>
              <td class="px-6 py-4 text-right">
                <button
                  class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  @click="openSettings(project, $event)"
                >
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="projectsStore.pagination.totalPages > 1"
        class="flex items-center justify-between"
      >
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Showing {{ (projectsStore.pagination.page - 1) * projectsStore.pagination.pageSize + 1 }}
          to {{ Math.min(projectsStore.pagination.page * projectsStore.pagination.pageSize, projectsStore.pagination.totalItems) }}
          of {{ projectsStore.pagination.totalItems }} projects
        </p>
        <div class="flex space-x-2">
          <NxButton
            variant="secondary"
            size="sm"
            :disabled="!projectsStore.pagination.hasPreviousPage"
            @click="projectsStore.setPage(projectsStore.pagination.page - 1); loadProjects()"
          >
            Previous
          </NxButton>
          <NxButton
            variant="secondary"
            size="sm"
            :disabled="!projectsStore.pagination.hasNextPage"
            @click="projectsStore.setPage(projectsStore.pagination.page + 1); loadProjects()"
          >
            Next
          </NxButton>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <CreateProjectModal
      :open="showCreateModal"
      @close="showCreateModal = false"
      @created="handleProjectCreated"
    />

    <ProjectSettingsModal
      :open="showSettingsModal"
      :project="selectedProject"
      @close="showSettingsModal = false"
      @updated="handleProjectUpdated"
      @deleted="handleProjectDeleted"
    />
  </WorkspaceLayout>
</template>
