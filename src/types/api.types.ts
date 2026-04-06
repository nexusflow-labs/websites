// Pagination types
export interface PaginationMeta {
  totalItems: number;
  totalPages: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface CursorPaginationMeta {
  nextCursor?: string;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CursorPaginatedResponse<T> {
  items: T[];
  meta: CursorPaginationMeta;
}

// Notification types
export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'COMMENT_ADDED'
  | 'MEMBER_ADDED'
  | 'MEMBER_REMOVED'
  | 'TASK_UPDATED';

export type EntityType = 'TASK' | 'PROJECT' | 'WORKSPACE' | 'MEMBER' | 'COMMENT' | 'LABEL';

export interface Notification {
  id: string;
  type: NotificationType;
  entityType: EntityType;
  entityId: string;
  userId: string;
  workspaceId?: string;
  actorId?: string;
  title: string;
  message?: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface ListNotificationsQuery {
  filter?: 'all' | 'unread' | 'read';
  cursor?: string;
  limit?: number;
}

export interface UnreadCountResponse {
  count: number;
}

// Activity log types
export type ActivityAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface ActivityLog {
  id: string;
  action: ActivityAction;
  entityType: EntityType;
  entityId: string;
  userId: string;
  user: {
    name: string;
    avatar: string;
  };
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ListActivityLogsQuery {
  page?: number;
  pageSize?: number;
  entityType?: EntityType;
  entityId?: string;
  userId?: string;
  action?: ActivityAction;
  fromDate?: string;
  toDate?: string;
}

// API Error type
export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
