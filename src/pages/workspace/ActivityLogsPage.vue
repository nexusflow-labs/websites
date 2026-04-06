<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { formatDistanceToNow, format } from 'date-fns';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { activityApi } from '@/api/activity.api';
import WorkspaceLayout from '@/components/layout/WorkspaceLayout.vue';
import NxSpinner from '@/components/ui/NxSpinner.vue';
import NxAvatar from '@/components/ui/NxAvatar.vue';
import NxSelect from '@/components/ui/NxSelect.vue';
import NxInput from '@/components/ui/NxInput.vue';
import NxButton from '@/components/ui/NxButton.vue';
import type { ActivityLog, ActivityAction, EntityType, PaginationMeta } from '@/types';

const route = useRoute();
const workspaceStore = useWorkspaceStore();

const workspaceId = computed(() => route.params.workspaceId as string);

const logs = ref<ActivityLog[]>([]);
const isLoading = ref(false);
const meta = ref<PaginationMeta | null>(null);
const currentPage = ref(1);

// Filters
const filterAction = ref<string>('');
const filterEntityType = ref<string>('');
const filterUserId = ref<string>('');
const filterFromDate = ref<string>('');
const filterToDate = ref<string>('');

const actionOptions = [
  { value: '', label: 'All actions' },
  { value: 'CREATE', label: 'Created' },
  { value: 'UPDATE', label: 'Updated' },
  { value: 'DELETE', label: 'Deleted' },
  { value: 'STATUS_CHANGE', label: 'Status changed' },
  { value: 'ASSIGN', label: 'Assigned' },
  { value: 'COMMENT', label: 'Commented' },
];

const entityTypeOptions = [
  { value: '', label: 'All types' },
  { value: 'TASK', label: 'Task' },
  { value: 'PROJECT', label: 'Project' },
  { value: 'COMMENT', label: 'Comment' },
  { value: 'WORKSPACE', label: 'Workspace' },
  { value: 'LABEL', label: 'Label' },
  { value: 'MEMBER', label: 'Member' },
];

const memberOptions = computed(() => [
  { value: '', label: 'All members' },
  ...workspaceStore.members.map((m) => ({
    value: m.userId,
    label: m.user?.fullName || 'Unknown',
  })),
]);

async function loadLogs() {
  if (!workspaceId.value) return;
  isLoading.value = true;
  try {
    const query: Record<string, unknown> = { page: currentPage.value, pageSize: 20 };
    if (filterAction.value) query.action = filterAction.value as ActivityAction;
    if (filterEntityType.value) query.entityType = filterEntityType.value as EntityType;
    if (filterUserId.value) query.userId = filterUserId.value;
    if (filterFromDate.value) query.fromDate = filterFromDate.value;
    if (filterToDate.value) query.toDate = filterToDate.value;
    const response = await activityApi.getForWorkspace(workspaceId.value, query);
    logs.value = response.items;
    meta.value = response.meta;
  } catch {
    // non-critical
  } finally {
    isLoading.value = false;
  }
}

function applyFilters() {
  currentPage.value = 1;
  loadLogs();
}

function resetFilters() {
  filterAction.value = '';
  filterEntityType.value = '';
  filterUserId.value = '';
  filterFromDate.value = '';
  filterToDate.value = '';
  currentPage.value = 1;
  loadLogs();
}

watch(currentPage, loadLogs);

onMounted(loadLogs);

// ── Description ──────────────────────────────────────────────────────────────
function getDescription(log: ActivityLog): string {
  const meta = log.metadata as Record<string, unknown> | undefined;
  const statusLabel = (s: string) =>
    s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  if (log.action === 'STATUS_CHANGE') {
    return `changed task status from ${statusLabel(meta?.oldStatus as string)} to ${statusLabel(meta?.newStatus as string)}`;
  }
  if (log.action === 'ASSIGN') return 'assigned a task to a member';
  if (log.action === 'COMMENT') return 'commented on a task';

  if (log.entityType === 'TASK') {
    if (log.action === 'CREATE') {
      const title = meta?.title as string;
      return title ? `created task "${title}"` : 'created a task';
    }
    if (log.action === 'UPDATE') {
      if (meta?.action === 'LABEL_ADDED') {
        const name = meta.labelName as string;
        return name ? `added label "${name}" to a task` : 'added a label to a task';
      }
      if (meta?.changes) {
        const fields = Object.keys(meta.changes as object);
        if (fields.includes('title')) {
          const t = (meta.changes as Record<string, { new: string }>).title;
          return `renamed task to "${t.new}"`;
        }
        if (fields.includes('priority')) {
          const p = (meta.changes as Record<string, { old: string; new: string }>).priority;
          return `changed task priority from ${p.old} to ${p.new}`;
        }
        if (fields.includes('dueDate')) return 'updated task due date';
        if (fields.includes('description')) return 'updated task description';
        return `updated task (${fields.join(', ')})`;
      }
      return 'updated a task';
    }
    if (log.action === 'DELETE') return 'deleted a task';
  }

  if (log.entityType === 'COMMENT') {
    if (log.action === 'UPDATE') return 'edited a comment';
    if (log.action === 'DELETE') return 'deleted a comment';
  }

  if (log.entityType === 'PROJECT') {
    if (log.action === 'CREATE') {
      const name = meta?.name as string;
      return name ? `created project "${name}"` : 'created a project';
    }
    if (log.action === 'UPDATE') {
      if (meta?.changes) {
        const fields = Object.keys(meta.changes as object);
        return `updated project (${fields.join(', ')})`;
      }
      return 'updated a project';
    }
    if (log.action === 'DELETE') return 'deleted a project';
  }

  if (log.entityType === 'WORKSPACE') {
    if (log.action === 'CREATE') {
      const name = meta?.name as string;
      return name ? `created workspace "${name}"` : 'created the workspace';
    }
    if (log.action === 'UPDATE' && meta?.oldName) {
      return `renamed workspace from "${meta.oldName}" to "${meta.newName}"`;
    }
  }

  if (log.entityType === 'LABEL') {
    if (log.action === 'CREATE') {
      const name = meta?.name as string;
      return name ? `created label "${name}"` : 'created a label';
    }
    if (log.action === 'DELETE') {
      const name = meta?.name as string;
      return name ? `deleted label "${name}"` : 'deleted a label';
    }
  }

  if (log.entityType === 'MEMBER') {
    if (log.action === 'CREATE') return 'joined the workspace';
    if (log.action === 'DELETE') return 'left the workspace';
  }

  const a = log.action === 'CREATE' ? 'created' : log.action === 'UPDATE' ? 'updated' : 'deleted';
  return `${a} a ${log.entityType.toLowerCase()}`;
}

function getMetaDetail(log: ActivityLog): string | null {
  const meta = log.metadata as Record<string, unknown> | undefined;
  if (!meta) return null;

  if (log.action === 'STATUS_CHANGE') {
    const statusLabel = (s: string) =>
      s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    return `${statusLabel(meta.oldStatus as string)} → ${statusLabel(meta.newStatus as string)}`;
  }

  if (log.action === 'COMMENT') {
    return null; // commentId not displayed
  }

  if (log.entityType === 'TASK' && log.action === 'UPDATE' && meta.changes) {
    const changes = meta.changes as Record<string, { old: unknown; new: unknown }>;
    const parts = Object.entries(changes).map(([field, change]) => {
      if (field === 'priority' || field === 'title') {
        return `${field}: "${change.old}" → "${change.new}"`;
      }
      return `${field} updated`;
    });
    return parts.join(', ') || null;
  }

  if (log.entityType === 'COMMENT' && log.action === 'UPDATE') {
    const oldContent = meta.oldContent as string;
    const newContent = meta.newContent as string;
    if (oldContent && newContent) {
      const truncate = (s: string) => (s.length > 40 ? s.slice(0, 40) + '…' : s);
      return `"${truncate(oldContent)}" → "${truncate(newContent)}"`;
    }
  }

  return null;
}

function getIconClass(log: ActivityLog): string {
  switch (log.action) {
    case 'CREATE': return 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400';
    case 'UPDATE': return 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400';
    case 'DELETE': return 'bg-danger-100 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400';
    case 'STATUS_CHANGE': return 'bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400';
    case 'ASSIGN': return 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400';
    case 'COMMENT': return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    default: return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
  }
}

function getEntityIcon(log: ActivityLog): string {
  if (log.action === 'COMMENT') return 'comment';
  if (log.action === 'STATUS_CHANGE') return 'status';
  if (log.action === 'ASSIGN') return 'user';
  switch (log.entityType) {
    case 'TASK': return 'task';
    case 'PROJECT': return 'folder';
    case 'COMMENT': return 'comment';
    case 'MEMBER': return 'user';
    case 'LABEL': return 'tag';
    default: return 'activity';
  }
}

function formatTime(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

function formatDate(date: string): string {
  return format(new Date(date), 'MMM d, yyyy HH:mm');
}

function getActionBadgeClass(action: string): string {
  switch (action) {
    case 'CREATE': return 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400';
    case 'UPDATE': return 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400';
    case 'DELETE': return 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400';
    case 'STATUS_CHANGE': return 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400';
    case 'ASSIGN': return 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400';
    case 'COMMENT': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  }
}

function getActionLabel(action: string): string {
  switch (action) {
    case 'CREATE': return 'Created';
    case 'UPDATE': return 'Updated';
    case 'DELETE': return 'Deleted';
    case 'STATUS_CHANGE': return 'Status';
    case 'ASSIGN': return 'Assign';
    case 'COMMENT': return 'Comment';
    default: return action;
  }
}
</script>

<template>
  <WorkspaceLayout>
    <template #header>
      <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Activity Logs</h1>
    </template>

    <div class="space-y-4">
      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          <NxSelect
            v-model="filterAction"
            :options="actionOptions"
            placeholder="All actions"
          />
          <NxSelect
            v-model="filterEntityType"
            :options="entityTypeOptions"
            placeholder="All types"
          />
          <NxSelect
            v-model="filterUserId"
            :options="memberOptions"
            placeholder="All members"
            searchable
          />
          <NxInput
            v-model="filterFromDate"
            type="date"
            placeholder="From date"
          />
          <NxInput
            v-model="filterToDate"
            type="date"
            placeholder="To date"
          />
        </div>
        <div class="flex items-center gap-2 mt-3">
          <NxButton size="sm" @click="applyFilters">Apply</NxButton>
          <NxButton size="sm" variant="ghost" @click="resetFilters">Reset</NxButton>
        </div>
      </div>

      <!-- Timeline -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div v-if="isLoading" class="flex justify-center py-16">
          <NxSpinner />
        </div>

        <div v-else-if="logs.length === 0" class="py-16 text-center">
          <p class="text-gray-400 dark:text-gray-500 text-sm">No activity found</p>
        </div>

        <ul v-else class="divide-y divide-gray-100 dark:divide-gray-700">
          <li
            v-for="log in logs"
            :key="log.id"
            class="flex items-start gap-4 px-6 py-4"
          >
            <!-- Icon -->
            <div :class="['w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5', getIconClass(log)]">
              <!-- task -->
              <svg v-if="getEntityIcon(log) === 'task'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <!-- folder -->
              <svg v-else-if="getEntityIcon(log) === 'folder'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <!-- comment -->
              <svg v-else-if="getEntityIcon(log) === 'comment'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <!-- user -->
              <svg v-else-if="getEntityIcon(log) === 'user'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <!-- tag -->
              <svg v-else-if="getEntityIcon(log) === 'tag'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <!-- status -->
              <svg v-else-if="getEntityIcon(log) === 'status'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <!-- default -->
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>

            <!-- Avatar + Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                  <NxAvatar :src="log.user.avatar" :name="log.user.name" size="xs" />
                  <p class="text-sm text-gray-700 dark:text-gray-300 min-w-0">
                    <span class="font-medium text-gray-900 dark:text-white">{{ log.user.name }}</span>
                    {{ ' ' + getDescription(log) }}
                  </p>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <span :class="['text-xs font-medium px-2 py-0.5 rounded-full', getActionBadgeClass(log.action)]">
                    {{ getActionLabel(log.action) }}
                  </span>
                  <span
                    class="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap"
                    :title="formatDate(log.createdAt)"
                  >
                    {{ formatTime(log.createdAt) }}
                  </span>
                </div>
              </div>

              <!-- Metadata detail -->
              <p v-if="getMetaDetail(log)" class="mt-1 text-xs text-gray-400 dark:text-gray-500 ml-7">
                {{ getMetaDetail(log) }}
              </p>
            </div>
          </li>
        </ul>

        <!-- Pagination -->
        <div
          v-if="meta && meta.totalPages > 1"
          class="flex items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-gray-700"
        >
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Page {{ meta.page }} of {{ meta.totalPages }}
            <span class="ml-1 text-gray-400">({{ meta.totalItems }} total)</span>
          </p>
          <div class="flex items-center gap-2">
            <NxButton
              size="sm"
              variant="ghost"
              :disabled="!meta.hasPreviousPage"
              @click="currentPage--"
            >
              Previous
            </NxButton>
            <NxButton
              size="sm"
              variant="ghost"
              :disabled="!meta.hasNextPage"
              @click="currentPage++"
            >
              Next
            </NxButton>
          </div>
        </div>
      </div>
    </div>
  </WorkspaceLayout>
</template>
