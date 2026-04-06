<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useAuthStore } from '@/stores/auth.store';
import NxSpinner from '@/components/ui/NxSpinner.vue';
import NxButton from '@/components/ui/NxButton.vue';
import CreateWorkspaceModal from '@/components/workspace/CreateWorkspaceModal.vue';

const router = useRouter();
const workspaceStore = useWorkspaceStore();
const authStore = useAuthStore();

const viewMode = ref<'grid' | 'list'>('grid');
const showCreateModal = ref(false);
const isLoading = ref(true);

const workspaces = computed(() => workspaceStore.workspaces);

onMounted(async () => {
  try {
    await workspaceStore.fetchWorkspaces();
  } catch (error) {
    console.error('Failed to fetch workspaces:', error);
  } finally {
    isLoading.value = false;
  }
});

function navigateToWorkspace(workspaceId: string) {
  router.push({ name: 'workspaceDashboard', params: { workspaceId } });
}

async function handleLogout() {
  await authStore.logout();
  router.push('/login');
}

function handleWorkspaceCreated() {
  showCreateModal.value = false;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <span class="text-white font-bold text-sm">N</span>
            </div>
            <span class="text-xl font-bold text-gray-900 dark:text-white">NexusFlow</span>
          </div>

          <div class="flex items-center space-x-4">
            <button
              class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              @click="handleLogout"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading state -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-32">
        <NxSpinner size="lg" />
        <p class="mt-4 text-gray-600 dark:text-gray-400">Loading workspaces...</p>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="workspaces.length === 0"
        class="flex flex-col items-center justify-center py-32 text-center"
      >
        <div class="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
          <svg
            class="w-8 h-8 text-primary-600 dark:text-primary-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to NexusFlow
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
          You don't have any workspaces yet. Create your first workspace to start managing your projects and teams.
        </p>
        <NxButton @click="showCreateModal = true">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Create Workspace
        </NxButton>
      </div>

      <!-- Workspaces list -->
      <div v-else>
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Workspaces</h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              Select a workspace to get started
            </p>
          </div>

          <div class="flex items-center space-x-4">
            <!-- View toggle -->
            <div class="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                :class="[
                  'p-2 rounded-md transition-colors',
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-700 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                ]"
                @click="viewMode = 'grid'"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
              <button
                :class="[
                  'p-2 rounded-md transition-colors',
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-700 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                ]"
                @click="viewMode = 'list'"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
              </button>
            </div>

            <NxButton @click="showCreateModal = true">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Create Workspace
            </NxButton>
          </div>
        </div>

        <!-- Grid view -->
        <div
          v-if="viewMode === 'grid'"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <button
            v-for="workspace in workspaces"
            :key="workspace.id"
            class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700
                   p-6 text-left hover:border-primary-500 dark:hover:border-primary-400
                   hover:shadow-lg transition-all duration-200 group"
            @click="navigateToWorkspace(workspace.id)"
          >
            <div class="flex items-start justify-between">
              <div
                class="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30
                       flex items-center justify-center text-primary-600 dark:text-primary-400
                       group-hover:scale-110 transition-transform"
              >
                <span class="text-xl font-bold">
                  {{ workspace.name.charAt(0).toUpperCase() }}
                </span>
              </div>
              <svg
                class="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>

            <h3 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
              {{ workspace.name }}
            </h3>
            <p
              v-if="workspace.description"
              class="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2"
            >
              {{ workspace.description }}
            </p>
            <p
              v-else
              class="mt-1 text-sm text-gray-400 dark:text-gray-500 italic"
            >
              No description
            </p>

            <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Created {{ formatDate(workspace.createdAt) }}
              </p>
            </div>
          </button>
        </div>

        <!-- List view -->
        <div
          v-else
          class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Workspace
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Created
                </th>
                <th class="px-6 py-3" />
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="workspace in workspaces"
                :key="workspace.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                @click="navigateToWorkspace(workspace.id)"
              >
                <td class="px-6 py-4">
                  <div class="flex items-center">
                    <div
                      class="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30
                             flex items-center justify-center text-primary-600 dark:text-primary-400"
                    >
                      <span class="font-bold">
                        {{ workspace.name.charAt(0).toUpperCase() }}
                      </span>
                    </div>
                    <span class="ml-3 font-medium text-gray-900 dark:text-white">
                      {{ workspace.name }}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span
                    v-if="workspace.description"
                    class="text-sm text-gray-600 dark:text-gray-400 line-clamp-1"
                  >
                    {{ workspace.description }}
                  </span>
                  <span
                    v-else
                    class="text-sm text-gray-400 dark:text-gray-500 italic"
                  >
                    No description
                  </span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-gray-500 dark:text-gray-400">
                    {{ formatDate(workspace.createdAt) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <svg
                    class="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <!-- Create Workspace Modal -->
    <CreateWorkspaceModal
      :open="showCreateModal"
      @close="showCreateModal = false"
      @created="handleWorkspaceCreated"
    />
  </div>
</template>
