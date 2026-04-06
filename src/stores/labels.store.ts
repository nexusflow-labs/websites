import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { labelsApi } from '@/api/labels.api';
import { getErrorMessage } from '@/api/http';
import type { Label, CreateLabelRequest, UpdateLabelRequest } from '@/types';

export const useLabelsStore = defineStore('labels', () => {
  // State
  const labels = ref<Label[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const hasLabels = computed(() => labels.value.length > 0);

  const labelById = computed(() => {
    const map = new Map<string, Label>();
    labels.value.forEach((label) => {
      map.set(label.id, label);
    });
    return (id: string) => map.get(id);
  });

  const sortedLabels = computed(() =>
    [...labels.value].sort((a, b) => a.name.localeCompare(b.name))
  );

  // Actions
  async function fetchLabels(workspaceId: string): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      labels.value = await labelsApi.getAll(workspaceId);
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function createLabel(
    workspaceId: string,
    data: CreateLabelRequest
  ): Promise<Label> {
    isLoading.value = true;
    error.value = null;

    try {
      const label = await labelsApi.create(workspaceId, data);
      labels.value.push(label);
      return label;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateLabel(
    workspaceId: string,
    labelId: string,
    data: UpdateLabelRequest
  ): Promise<Label> {
    error.value = null;

    try {
      const updated = await labelsApi.update(workspaceId, labelId, data);
      const index = labels.value.findIndex((l) => l.id === labelId);
      if (index !== -1) {
        labels.value[index] = updated;
      }
      return updated;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    }
  }

  async function deleteLabel(workspaceId: string, labelId: string): Promise<void> {
    error.value = null;

    try {
      await labelsApi.delete(workspaceId, labelId);
      labels.value = labels.value.filter((l) => l.id !== labelId);
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    }
  }

  function clearError(): void {
    error.value = null;
  }

  function reset(): void {
    labels.value = [];
    isLoading.value = false;
    error.value = null;
  }

  return {
    // State
    labels,
    isLoading,
    error,

    // Getters
    hasLabels,
    labelById,
    sortedLabels,

    // Actions
    fetchLabels,
    createLabel,
    updateLabel,
    deleteLabel,
    clearError,
    reset,
  };
});
