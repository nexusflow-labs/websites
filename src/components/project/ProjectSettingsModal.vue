<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useProjectsStore } from '@/stores/projects.store';
import { useToast } from '@/composables/useToast';
import NxModal from '@/components/ui/NxModal.vue';
import NxInput from '@/components/ui/NxInput.vue';
import NxTextarea from '@/components/ui/NxTextarea.vue';
import NxButton from '@/components/ui/NxButton.vue';
import NxSelect from '@/components/ui/NxSelect.vue';
import type { Project, ProjectStatus } from '@/types';

interface Props {
  open: boolean;
  project: Project | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  updated: [];
  deleted: [];
}>();

const router = useRouter();
const route = useRoute();
const projectsStore = useProjectsStore();
const toast = useToast();

const name = ref('');
const description = ref('');
const status = ref<ProjectStatus>('ACTIVE');
const isSubmitting = ref(false);
const isDeleting = ref(false);
const showDeleteConfirm = ref(false);
const errors = ref<{ name?: string; description?: string }>({});

const workspaceId = computed(() => route.params.workspaceId as string);

const statusOptions = [
  { value: 'ACTIVE', label: 'Active', description: 'Project is in progress' },
  { value: 'COMPLETED', label: 'Completed', description: 'Project has been finished' },
  { value: 'ARCHIVED', label: 'Archived', description: 'Project is archived' },
];

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.project) {
      // Populate form with project data
      name.value = props.project.name;
      description.value = props.project.description || '';
      status.value = props.project.status;
      errors.value = {};
      showDeleteConfirm.value = false;
    }
  }
);

function validate(): boolean {
  errors.value = {};

  if (!name.value.trim()) {
    errors.value.name = 'Project name is required';
    return false;
  }

  if (name.value.trim().length < 2) {
    errors.value.name = 'Project name must be at least 2 characters';
    return false;
  }

  if (name.value.trim().length > 100) {
    errors.value.name = 'Project name must be less than 100 characters';
    return false;
  }

  if (description.value.length > 500) {
    errors.value.description = 'Description must be less than 500 characters';
    return false;
  }

  return true;
}

async function handleSubmit() {
  if (!validate() || !props.project) return;

  isSubmitting.value = true;

  try {
    await projectsStore.updateProject(workspaceId.value, props.project.id, {
      name: name.value.trim(),
      description: description.value.trim() || undefined,
      status: status.value,
    });

    toast.success('Project updated successfully');
    emit('updated');
    emit('close');
  } catch (error) {
    toast.error(projectsStore.error || 'Failed to update project');
  } finally {
    isSubmitting.value = false;
  }
}

async function handleDelete() {
  if (!props.project) return;

  isDeleting.value = true;

  try {
    await projectsStore.deleteProject(workspaceId.value, props.project.id);
    toast.success('Project deleted successfully');
    emit('deleted');
    emit('close');

    // Navigate back to projects list
    router.push({
      name: 'workspaceProjects',
      params: { workspaceId: workspaceId.value },
    });
  } catch (error) {
    toast.error(projectsStore.error || 'Failed to delete project');
  } finally {
    isDeleting.value = false;
    showDeleteConfirm.value = false;
  }
}

function handleClose() {
  if (!isSubmitting.value && !isDeleting.value) {
    emit('close');
  }
}
</script>

<template>
  <NxModal :open="open" title="Project Settings" size="lg" @close="handleClose">
    <form id="project-settings-form" @submit.prevent="handleSubmit">
      <div class="space-y-6">
        <!-- General Settings -->
        <div class="space-y-4">
          <h3 class="text-sm font-medium text-gray-900 dark:text-white">
            General
          </h3>

          <NxInput
            v-model="name"
            label="Project Name"
            placeholder="Enter project name"
            :error="errors.name"
            :disabled="isSubmitting"
            required
          />

          <NxTextarea
            v-model="description"
            label="Description"
            placeholder="Describe your project (optional)"
            :rows="3"
            :disabled="isSubmitting"
            :error="errors.description"
          />

          <NxSelect
            v-model="status"
            :options="statusOptions"
            label="Status"
            :disabled="isSubmitting"
          />
        </div>

        <!-- Danger Zone -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 class="text-sm font-medium text-danger-600 dark:text-danger-400 mb-4">
            Danger Zone
          </h3>

          <div
            class="rounded-lg border border-danger-200 dark:border-danger-800/50
                   bg-danger-50 dark:bg-danger-900/20 p-4"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  Delete this project
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Once deleted, this project and all its tasks cannot be recovered.
                </p>
              </div>
              <NxButton
                v-if="!showDeleteConfirm"
                type="button"
                variant="danger"
                size="sm"
                @click="showDeleteConfirm = true"
              >
                Delete
              </NxButton>
            </div>

            <!-- Delete confirmation -->
            <div v-if="showDeleteConfirm" class="mt-4 pt-4 border-t border-danger-200 dark:border-danger-800/50">
              <p class="text-sm text-danger-600 dark:text-danger-400 mb-3">
                Are you sure you want to delete "{{ project?.name }}"? This action cannot be undone.
              </p>
              <div class="flex space-x-3">
                <NxButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  :disabled="isDeleting"
                  @click="showDeleteConfirm = false"
                >
                  Cancel
                </NxButton>
                <NxButton
                  type="button"
                  variant="danger"
                  size="sm"
                  :loading="isDeleting"
                  @click="handleDelete"
                >
                  Yes, delete project
                </NxButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end space-x-3">
        <NxButton
          type="button"
          variant="secondary"
          :disabled="isSubmitting || isDeleting"
          @click="handleClose"
        >
          Cancel
        </NxButton>
        <NxButton
          type="submit"
          form="project-settings-form"
          :loading="isSubmitting"
          :disabled="isDeleting"
        >
          Save Changes
        </NxButton>
      </div>
    </template>
  </NxModal>
</template>
