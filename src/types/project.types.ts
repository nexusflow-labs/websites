export type ProjectStatus = 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  workspaceId: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
}

export interface ListProjectsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ProjectStatus;
  ownerId?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'name';
  sortDirection?: 'asc' | 'desc';
}
