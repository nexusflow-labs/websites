<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useToast } from '@/composables/useToast';
import WorkspaceLayout from '@/components/layout/WorkspaceLayout.vue';
import NxTabs from '@/components/ui/NxTabs.vue';
import NxInput from '@/components/ui/NxInput.vue';
import NxTextarea from '@/components/ui/NxTextarea.vue';
import NxButton from '@/components/ui/NxButton.vue';
import ConfirmModal from '@/components/common/ConfirmModal.vue';
import InvitationsTab from '@/components/workspace/InvitationsTab.vue';
import { NxModal } from '@/components/ui';

const route = useRoute();
const router = useRouter();
const workspaceStore = useWorkspaceStore();
const toast = useToast();

const workspaceId = computed(() => route.params.workspaceId as string);

const activeTab = ref('general');
const tabs = [
  { id: 'general', label: 'General' },
  { id: 'invitations', label: 'Invitations' },
  { id: 'danger', label: 'Danger Zone' },
];

// General settings form
const name = ref('');
const description = ref('');
const isSaving = ref(false);
const errors = ref<{ name?: string }>({});

// Delete workspace
const showDeleteModal = ref(false);
const isDeleting = ref(false);
const deleteConfirmation = ref('');

onMounted(() => {
  if (workspaceStore.currentWorkspace) {
    name.value = workspaceStore.currentWorkspace.name;
    description.value = workspaceStore.currentWorkspace.description || '';
  }
});

watch(
  () => workspaceStore.currentWorkspace,
  (workspace) => {
    if (workspace) {
      name.value = workspace.name;
      description.value = workspace.description || '';
    }
  }
);

function validateGeneral(): boolean {
  errors.value = {};

  if (!name.value.trim()) {
    errors.value.name = 'Workspace name is required';
    return false;
  }

  if (name.value.trim().length < 3) {
    errors.value.name = 'Workspace name must be at least 3 characters';
    return false;
  }

  if (name.value.trim().length > 50) {
    errors.value.name = 'Workspace name must be less than 50 characters';
    return false;
  }

  return true;
}

async function saveGeneralSettings() {
  if (!validateGeneral()) return;

  isSaving.value = true;

  try {
    await workspaceStore.updateWorkspace(workspaceId.value, {
      name: name.value.trim(),
      description: description.value.trim() || undefined,
    });
    toast.success('Workspace settings saved');
  } catch (error) {
    toast.error(workspaceStore.error || 'Failed to save settings');
  } finally {
    isSaving.value = false;
  }
}

async function handleDeleteWorkspace() {
  if (deleteConfirmation.value !== workspaceStore.currentWorkspace?.name) {
    return;
  }

  isDeleting.value = true;

  try {
    await workspaceStore.deleteWorkspace(workspaceId.value);
    toast.success('Workspace deleted');
    showDeleteModal.value = false;
    router.push('/');
  } catch (error) {
    toast.error(workspaceStore.error || 'Failed to delete workspace');
  } finally {
    isDeleting.value = false;
  }
}

function openDeleteModal() {
  deleteConfirmation.value = '';
  showDeleteModal.value = true;
}
</script>

<template>
  <WorkspaceLayout>
    <template #header>
      <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
        Workspace Settings
      </h1>
    </template>

    <div class="max-w-3xl">
      <NxTabs v-model="activeTab" :tabs="tabs">
        <!-- General Tab -->
        <div v-if="activeTab === 'general'" class="space-y-6">
          <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              General Settings
            </h2>

            <form @submit.prevent="saveGeneralSettings" class="space-y-4">
              <NxInput
                v-model="name"
                label="Workspace Name"
                placeholder="Enter workspace name"
                :error="errors.name"
                :disabled="isSaving"
                required
              />

              <NxTextarea
                v-model="description"
                label="Description"
                placeholder="Describe your workspace (optional)"
                :rows="3"
                :disabled="isSaving"
              />

              <div class="pt-4">
                <NxButton type="submit" :loading="isSaving">
                  Save Changes
                </NxButton>
              </div>
            </form>
          </div>
        </div>

        <!-- Invitations Tab -->
        <div v-else-if="activeTab === 'invitations'">
          <InvitationsTab :workspace-id="workspaceId" />
        </div>

        <!-- Danger Zone Tab -->
        <div v-else-if="activeTab === 'danger'" class="space-y-6">
          <div
            class="bg-white dark:bg-gray-800 rounded-xl border border-danger-200 dark:border-danger-900/50 p-6"
          >
            <h2 class="text-lg font-semibold text-danger-600 dark:text-danger-400 mb-4">
              Danger Zone
            </h2>

            <div class="space-y-4">
              <div
                class="flex items-center justify-between p-4 bg-danger-50 dark:bg-danger-900/20 rounded-lg"
              >
                <div>
                  <h3 class="font-medium text-gray-900 dark:text-white">
                    Delete Workspace
                  </h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Permanently delete this workspace and all its data. This action cannot be undone.
                  </p>
                </div>
                <NxButton
                  variant="danger"
                  :disabled="!workspaceStore.canDeleteWorkspace"
                  @click="openDeleteModal"
                >
                  Delete Workspace
                </NxButton>
              </div>

              <p
                v-if="!workspaceStore.canDeleteWorkspace"
                class="text-sm text-gray-500 dark:text-gray-400"
              >
                Only workspace owners can delete workspaces.
              </p>
            </div>
          </div>
        </div>
      </NxTabs>
    </div>

    <!-- Delete Confirmation Modal -->
    <NxModal
      :open="showDeleteModal"
      title="Delete Workspace"
      size="md"
      @close="showDeleteModal = false"
    >
      <div class="space-y-4">
        <div class="flex items-center space-x-3 p-4 bg-danger-50 dark:bg-danger-900/20 rounded-lg">
          <svg
            class="w-6 h-6 text-danger-600 dark:text-danger-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p class="text-sm text-danger-700 dark:text-danger-300">
            This action is permanent and cannot be undone. All projects, tasks, and members will be removed.
          </p>
        </div>

        <p class="text-sm text-gray-600 dark:text-gray-400">
          To confirm, type
          <strong class="text-gray-900 dark:text-white">{{ workspaceStore.currentWorkspace?.name }}</strong>
          below:
        </p>

        <NxInput
          v-model="deleteConfirmation"
          placeholder="Type workspace name to confirm"
          :disabled="isDeleting"
        />
      </div>

      <template #footer>
        <div class="flex justify-end space-x-3">
          <NxButton
            variant="secondary"
            :disabled="isDeleting"
            @click="showDeleteModal = false"
          >
            Cancel
          </NxButton>
          <NxButton
            variant="danger"
            :loading="isDeleting"
            :disabled="deleteConfirmation !== workspaceStore.currentWorkspace?.name"
            @click="handleDeleteWorkspace"
          >
            Delete Workspace
          </NxButton>
        </div>
      </template>
    </NxModal>
  </WorkspaceLayout>
</template>
