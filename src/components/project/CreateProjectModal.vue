<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useProjectsStore } from '@/stores/projects.store';
import { useToast } from '@/composables/useToast';
import NxModal from '@/components/ui/NxModal.vue';
import NxInput from '@/components/ui/NxInput.vue';
import NxTextarea from '@/components/ui/NxTextarea.vue';
import NxButton from '@/components/ui/NxButton.vue';

interface Props {
  open: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  created: [];
}>();

const router = useRouter();
const route = useRoute();
const projectsStore = useProjectsStore();
const toast = useToast();

const name = ref('');
const description = ref('');
const isSubmitting = ref(false);
const errors = ref<{ name?: string; description?: string }>({});

const workspaceId = computed(() => route.params.workspaceId as string);

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      // Reset form when modal opens
      name.value = '';
      description.value = '';
      errors.value = {};
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
  if (!validate()) return;

  isSubmitting.value = true;

  try {
    const project = await projectsStore.createProject(workspaceId.value, {
      name: name.value.trim(),
      description: description.value.trim() || undefined,
    });

    toast.success('Project created successfully');
    emit('created');
    emit('close');

    // Navigate to the new project
    router.push({
      name: 'project',
      params: { workspaceId: workspaceId.value, projectId: project.id },
    });
  } catch (error) {
    toast.error(projectsStore.error || 'Failed to create project');
  } finally {
    isSubmitting.value = false;
  }
}

function handleClose() {
  if (!isSubmitting.value) {
    emit('close');
  }
}

</script>

<template>
  <NxModal :open="open" title="Create Project" @close="handleClose">
    <form id="create-project-form" @submit.prevent="handleSubmit">
      <div class="space-y-4">
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
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end space-x-3">
        <NxButton
          type="button"
          variant="secondary"
          :disabled="isSubmitting"
          @click="handleClose"
        >
          Cancel
        </NxButton>
        <NxButton
          type="submit"
          form="create-project-form"
          :loading="isSubmitting"
        >
          Create Project
        </NxButton>
      </div>
    </template>
  </NxModal>
</template>
