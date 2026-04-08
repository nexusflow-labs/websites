import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { projectsApi } from '@/api/projects.api';
import { getErrorMessage } from '@/api/http';
import type {
  Project,
  ProjectStatus,
  CreateProjectRequest,
  UpdateProjectRequest,
  ListProjectsQuery,
  PaginationMeta,
} from '@/types';

export interface ProjectFilters {
  search?: string;
  status?: ProjectStatus;
  ownerId?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'name';
  sortDirection?: 'asc' | 'desc';
}

export const useProjectsStore = defineStore('projects', () => {
  // State
  const projects = ref<Project[]>([]);
  const currentProject = ref<Project | null>(null);
  const pagination = ref<PaginationMeta>({
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const filters = ref<ProjectFilters>({
    sortBy: 'createdAt',
    sortDirection: 'desc',
  });
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const activeProjects = computed(() =>
    projects.value.filter((p) => p.status === 'ACTIVE')
  );

  const archivedProjects = computed(() =>
    projects.value.filter((p) => p.status === 'ARCHIVED')
  );

  const completedProjects = computed(() =>
    projects.value.filter((p) => p.status === 'COMPLETED')
  );

  const hasProjects = computed(() => projects.value.length > 0);

  // Actions
  async function fetchProjects(
    workspaceId: string,
    query?: ListProjectsQuery
  ): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const mergedQuery: ListProjectsQuery = {
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        ...filters.value,
        ...query,
      };

      const response = await projectsApi.getAll(workspaceId, mergedQuery);
      projects.value = response.items;
      pagination.value = response.meta;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchProject(
    workspaceId: string,
    projectId: string
  ): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      currentProject.value = await projectsApi.getById(workspaceId, projectId);
    } catch (err) {
      error.value = getErrorMessage(err);
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  }

  async function createProject(
    workspaceId: string,
    data: CreateProjectRequest
  ): Promise<Project> {
    isLoading.value = true;
    error.value = null;

    try {
      const project = await projectsApi.create(workspaceId, data);
      projects.value.unshift(project);
      pagination.value.totalItems++;
      return project;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateProject(
    workspaceId: string,
    projectId: string,
    data: UpdateProjectRequest
  ): Promise<Project> {
    isLoading.value = true;
    error.value = null;

    try {
      const updated = await projectsApi.update(workspaceId, projectId, data);

      // Update in list
      const index = projects.value.findIndex((p) => p.id === projectId);
      if (index !== -1) {
        projects.value[index] = updated;
      }

      // Update current if same
      if (currentProject.value?.id === projectId) {
        currentProject.value = updated;
      }

      return updated;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteProject(
    workspaceId: string,
    projectId: string
  ): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      await projectsApi.delete(workspaceId, projectId);
      projects.value = projects.value.filter((p) => p.id !== projectId);
      pagination.value.totalItems--;

      if (currentProject.value?.id === projectId) {
        currentProject.value = null;
      }
    } catch (err) {
      error.value = getErrorMessage(err);
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  }

  function setFilters(newFilters: ProjectFilters): void {
    filters.value = { ...filters.value, ...newFilters };
  }

  function setPage(page: number): void {
    pagination.value.page = page;
  }

  function setPageSize(pageSize: number): void {
    pagination.value.pageSize = pageSize;
    pagination.value.page = 1;
  }

  // Real-time mutations
  function addProjectFromRealtime(project: Project): void {
    if (projects.value.some((item) => item.id === project.id)) return;
    projects.value.unshift(project);
    pagination.value.totalItems++;
  }

  function updateProjectFromRealtime(project: Project): void {
    const index = projects.value.findIndex((item) => item.id === project.id);
    if (index !== -1) {
      projects.value[index] = { ...projects.value[index], ...project };
    }

    if (currentProject.value?.id === project.id) {
      currentProject.value = { ...currentProject.value, ...project };
    }
  }

  function removeProjectFromRealtime(projectId: string): void {
    const exists = projects.value.some((project) => project.id === projectId);
    projects.value = projects.value.filter((project) => project.id !== projectId);

    if (exists) {
      pagination.value.totalItems = Math.max(0, pagination.value.totalItems - 1);
    }

    if (currentProject.value?.id === projectId) {
      currentProject.value = null;
    }
  }

  function clearError(): void {
    error.value = null;
  }

  function reset(): void {
    projects.value = [];
    currentProject.value = null;
    pagination.value = {
      page: 1,
      pageSize: 20,
      totalItems: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    };
    filters.value = {
      sortBy: 'createdAt',
      sortDirection: 'desc',
    };
    isLoading.value = false;
    error.value = null;
  }

  return {
    // State
    projects,
    currentProject,
    pagination,
    filters,
    isLoading,
    error,

    // Getters
    activeProjects,
    archivedProjects,
    completedProjects,
    hasProjects,

    // Actions
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    setFilters,
    setPage,
    setPageSize,
    addProjectFromRealtime,
    updateProjectFromRealtime,
    removeProjectFromRealtime,
    clearError,
    reset,
  };
});
