<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useWorkspaceStore } from '@/stores/workspace.store';
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
const workspaceStore = useWorkspaceStore();
const toast = useToast();

const name = ref('');
const description = ref('');
const isSubmitting = ref(false);
const errors = ref<{ name?: string; description?: string }>({});

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

async function handleSubmit() {
  if (!validate()) return;

  isSubmitting.value = true;

  try {
    const workspace = await workspaceStore.createWorkspace({
      name: name.value.trim(),
      description: description.value.trim() || undefined,
    });

    toast.success('Workspace created successfully');
    emit('created');

    // Navigate to the new workspace
    router.push({
      name: 'workspaceDashboard',
      params: { workspaceId: workspace.id },
    });
  } catch (error) {
    toast.error(workspaceStore.error || 'Failed to create workspace');
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
  <NxModal :open="open" title="Create Workspace" @close="handleClose">
    <form id="create-workspace-form" @submit.prevent="handleSubmit">
      <div class="space-y-4">
        <NxInput
          v-model="name"
          label="Workspace Name"
          placeholder="Enter workspace name"
          :error="errors.name"
          :disabled="isSubmitting"
          required
        />

        <NxTextarea
          v-model="description"
          label="Description"
          placeholder="Describe your workspace (optional)"
          :rows="3"
          :disabled="isSubmitting"
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
          form="create-workspace-form"
          :loading="isSubmitting"
        >
          Create Workspace
        </NxButton>
      </div>
    </template>
  </NxModal>
</template>
