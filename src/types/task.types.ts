import type { User } from './auth.types';
import type { Label } from './workspace.types';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  projectId: string;
  assigneeId?: string;
  creatorId: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskWithDetails extends Task {
  assignee?: User;
  creator: User;
  labels: Label[];
  subtasks?: Task[];
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  parentId?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
}

export interface AssignTaskRequest {
  assigneeId?: string | null;
}

export interface ListTasksQuery {
  page?: number;
  pageSize?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  creatorId?: string;
  rootOnly?: boolean;
  dueDateFrom?: string;
  dueDateTo?: string;
  createdFrom?: string;
  createdTo?: string;
  search?: string;
  labelIds?: string;
  overdue?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'title' | 'position';
  sortDirection?: 'asc' | 'desc';
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommentWithUser extends Comment {
  author: User;
}

export interface CreateCommentRequest {
  content: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface FileUpload {
  id: string;
  filename: string;
  contentType: string;
  size?: number;
  status: FileUploadStatus;
  resourceType?: 'TASK' | 'PROJECT';
  resourceId?: string;
  uploadedAt?: string;
  attachedAt?: string;
  createdAt: string;
}

export type FileUploadStatus = 'REGISTERED' | 'UPLOADED' | 'ATTACHED';

export interface RegisterUploadRequest {
  filename: string;
  contentType: string;
  workspaceId?: string;
}

export interface RegisterUploadResponse {
  id: string;
  uploadUrl: string;
  expiresAt: string;
}

export interface DownloadUrlResponse {
  downloadUrl: string;
  filename: string;
  contentType: string;
  size?: number;
  expiresAt: string;
}
