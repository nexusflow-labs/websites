<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useTasksStore } from '@/stores/tasks.store';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useLabelsStore } from '@/stores/labels.store';
import { useToast } from '@/composables/useToast';
import NxModal from '@/components/ui/NxModal.vue';
import NxInput from '@/components/ui/NxInput.vue';
import NxTextarea from '@/components/ui/NxTextarea.vue';
import NxButton from '@/components/ui/NxButton.vue';
import NxSelect from '@/components/ui/NxSelect.vue';
import LabelsPicker from '@/components/task/LabelsPicker.vue';
import type { TaskPriority, TaskStatus } from '@/types';

interface Props {
  open: boolean;
  projectId: string;
  defaultStatus?: TaskStatus;
  parentId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  defaultStatus: 'TODO',
});

const emit = defineEmits<{
  close: [];
  created: [taskId: string];
}>();

const route = useRoute();
const tasksStore = useTasksStore();
const workspaceStore = useWorkspaceStore();
const labelsStore = useLabelsStore();
const toast = useToast();

const workspaceId = computed(() => route.params.workspaceId as string);

// Form state
const title = ref('');
const description = ref('');
const priority = ref<TaskPriority>('MEDIUM');
const dueDate = ref('');
const assigneeId = ref('');
const selectedLabelIds = ref<string[]>([]);

const isSubmitting = ref(false);
const errors = ref<{ title?: string; description?: string }>({});

// Priority options
const priorityOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

// Assignee options
const assigneeOptions = computed(() => [
  { value: '', label: 'Unassigned' },
  ...workspaceStore.members.map((m) => ({
    value: m.userId,
    label: m.user.fullName,
  })),
]);

// Reset form when modal opens
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      title.value = '';
      description.value = '';
      priority.value = 'MEDIUM';
      dueDate.value = '';
      assigneeId.value = '';
      selectedLabelIds.value = [];
      errors.value = {};
    }
  }
);

function validate(): boolean {
  errors.value = {};

  if (!title.value.trim()) {
    errors.value.title = 'Task title is required';
    return false;
  }

  if (title.value.trim().length < 2) {
    errors.value.title = 'Task title must be at least 2 characters';
    return false;
  }

  if (title.value.trim().length > 200) {
    errors.value.title = 'Task title must be less than 200 characters';
    return false;
  }

  if (description.value.length > 2000) {
    errors.value.description = 'Description must be less than 2000 characters';
    return false;
  }

  return true;
}

async function handleSubmit() {
  if (!validate()) return;

  isSubmitting.value = true;

  try {
    const task = await tasksStore.createTask(props.projectId, {
      title: title.value.trim(),
      description: description.value.trim() || undefined,
      priority: priority.value,
      dueDate: dueDate.value || undefined,
      parentId: props.parentId,
    });

    // Set status if not TODO
    if (props.defaultStatus !== 'TODO') {
      await tasksStore.updateTask(props.projectId, task.id, {
        status: props.defaultStatus,
      });
    }

    // Assign if selected
    if (assigneeId.value) {
      await tasksStore.assignTask(props.projectId, task.id, {
        assigneeId: assigneeId.value,
      });
    }

    // Add labels
    for (const labelId of selectedLabelIds.value) {
      await tasksStore.addLabelToTask(task.id, labelId);
    }

    toast.success(props.parentId ? 'Subtask created successfully' : 'Task created successfully');
    emit('created', task.id);
    emit('close');
  } catch (error) {
    toast.error(tasksStore.error || 'Failed to create task');
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
  <NxModal
    :open="open"
    :title="parentId ? 'Create Subtask' : 'Create Task'"
    size="lg"
    @close="handleClose"
  >
    <form
      id="create-task-form"
      @submit.prevent="handleSubmit"
    >
      <div class="space-y-4">
        <!-- Title -->
        <NxInput
          v-model="title"
          label="Title"
          placeholder="Enter task title"
          :error="errors.title"
          :disabled="isSubmitting"
          required
        />

        <!-- Description -->
        <NxTextarea
          v-model="description"
          label="Description"
          placeholder="Describe the task (supports markdown)"
          :rows="4"
          :disabled="isSubmitting"
          :error="errors.description"
        />

        <!-- Priority & Due Date Row -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority
            </label>
            <NxSelect
              v-model="priority"
              :options="priorityOptions"
              :disabled="isSubmitting"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Due Date
            </label>
            <input
              v-model="dueDate"
              type="date"
              :disabled="isSubmitting"
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed"
            >
          </div>
        </div>

        <!-- Assignee -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Assignee
          </label>
          <NxSelect
            v-model="assigneeId"
            :options="assigneeOptions"
            placeholder="Select assignee"
            :disabled="isSubmitting"
          />
        </div>

        <!-- Labels -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Labels
          </label>
          <LabelsPicker
            v-model="selectedLabelIds"
            :workspace-id="workspaceId"
            :disabled="isSubmitting"
          />
        </div>
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
          form="create-task-form"
          :loading="isSubmitting"
        >
          {{ parentId ? 'Create Subtask' : 'Create Task' }}
        </NxButton>
      </div>
    </template>
  </NxModal>
</template>
