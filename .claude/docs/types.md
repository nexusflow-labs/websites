# NexusFlow TypeScript Types & Enums

## Enumerations

```typescript
// Task Status
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE'

// Task Priority
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

// Project Status
type ProjectStatus = 'ACTIVE' | 'ARCHIVED' | 'COMPLETED'

// Member Role
type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER'

// Notification Type
type NotificationType =
  | 'TASK_ASSIGNED'
  | 'COMMENT_ADDED'
  | 'MEMBER_ADDED'
  | 'MEMBER_REMOVED'
  | 'TASK_UPDATED'

// Activity Action
type ActivityAction = 'CREATE' | 'UPDATE' | 'DELETE'

// Entity Type
type EntityType = 'TASK' | 'PROJECT' | 'WORKSPACE' | 'MEMBER' | 'COMMENT' | 'LABEL'

// File Upload Status
type FileUploadStatus = 'REGISTERED' | 'UPLOADED' | 'ATTACHED'

// Invitation Status
type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
```

---

## Core Entity Types

```typescript
// User
interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

// Workspace
interface Workspace {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

// Member
interface Member {
  id: string
  userId: string
  workspaceId: string
  role: MemberRole
  createdAt: string
}

interface MemberWithUser extends Member {
  user: User
}

// Project
interface Project {
  id: string
  name: string
  description?: string
  status: ProjectStatus
  workspaceId: string
  ownerId: string
  createdAt: string
  updatedAt: string
}

// Task
interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
  projectId: string
  assigneeId?: string
  creatorId: string
  parentId?: string
  createdAt: string
  updatedAt: string
}

// Comment
interface Comment {
  id: string
  content: string
  taskId: string
  authorId: string
  createdAt: string
  updatedAt: string
}

interface CommentWithUser extends Omit<Comment, 'authorId'> {
  author: User
}

// Label
interface Label {
  id: string
  name: string
  color: string  // hex #RRGGBB
  workspaceId: string
  createdAt: string
}

// Notification
interface Notification {
  id: string
  type: NotificationType
  entityType: EntityType
  entityId: string
  userId: string
  workspaceId?: string
  actorId?: string
  title: string
  message?: string
  metadata?: Record<string, any>
  isRead: boolean
  readAt?: string
  createdAt: string
}

// Activity Log
interface ActivityLog {
  id: string
  action: ActivityAction
  entityType: EntityType
  entityId: string
  userId: string
  metadata?: Record<string, any>
  createdAt: string
}

// File Upload
interface FileUpload {
  id: string
  filename: string
  contentType: string
  size?: number
  status: FileUploadStatus
  resourceType?: 'TASK' | 'PROJECT'
  resourceId?: string
  uploadedAt?: string
  attachedAt?: string
  createdAt: string
}

// Invitation
interface Invitation {
  id: string
  email: string
  invitedById: string
  workspaceId: string
  role: MemberRole
  status: InvitationStatus
  expiresAt: string
  createdAt: string
}
```

---

## Pagination Types

```typescript
// Offset-based pagination
interface PaginationMeta {
  totalItems: number
  totalPages: number
  page: number
  pageSize: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface PaginatedResponse<T> {
  items: T[]
  meta: PaginationMeta
}

// Cursor-based pagination (for notifications)
interface CursorPaginationMeta {
  nextCursor?: string
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface CursorPaginatedResponse<T> {
  items: T[]
  meta: CursorPaginationMeta
}
```

---

## Store State Types

```typescript
// Auth Store
interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

// Workspace Store
interface WorkspaceState {
  currentWorkspace: Workspace | null
  members: MemberWithUser[]
  userRole: MemberRole | null
  isLoading: boolean
}

// Projects Store
interface ProjectsState {
  projects: Project[]
  currentProject: Project | null
  pagination: PaginationMeta
  filters: ProjectFilters
  isLoading: boolean
}

// Tasks Store
interface TasksState {
  tasks: Task[]
  tasksByStatus: Record<TaskStatus, Task[]>
  currentTask: Task | null
  pagination: PaginationMeta
  filters: TaskFilters
  isLoading: boolean
}

// Notifications Store
interface NotificationsState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
}
```

---

## Filter Types

```typescript
interface ProjectFilters {
  search?: string
  status?: ProjectStatus
  ownerId?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'name'
  sortDirection?: 'asc' | 'desc'
}

interface TaskFilters {
  search?: string
  status?: TaskStatus
  priority?: TaskPriority
  assigneeId?: string
  creatorId?: string
  labelIds?: string[]
  dueDateFrom?: string
  dueDateTo?: string
  overdue?: boolean
  rootOnly?: boolean
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'title' | 'position'
  sortDirection?: 'asc' | 'desc'
}
```

---

## Dashboard Types

```typescript
interface TaskStatusCount {
  status: TaskStatus
  count: number
}

interface TaskPriorityCount {
  priority: TaskPriority
  count: number
}

interface ProjectStats {
  projectId: string
  projectName: string
  totalTasks: number
  completedTasks: number
  completionRate: number  // 0-100
}

interface WorkspaceStatistics {
  workspaceId: string
  totalProjects: number
  totalTasks: number
  totalMembers: number
  tasksByStatus: TaskStatusCount[]
  tasksByPriority: TaskPriorityCount[]
  overdueTasks: number
  tasksCompletedThisWeek: number
  tasksCreatedThisWeek: number
  projectStats: ProjectStats[]
}
```

---

## WebSocket Event Payloads

```typescript
// Task Events
interface TaskCreatedEvent {
  task: Task
}

interface TaskUpdatedEvent {
  task: Task
  changes: Partial<Task>
  updatedBy: string
}

interface TaskDeletedEvent {
  taskId: string
  deletedBy: string
}

interface TaskAssignedEvent {
  taskId: string
  assigneeId: string | null
  previousAssigneeId: string | null
  assignedBy: string
}

// Comment Events
interface CommentCreatedEvent {
  comment: CommentWithUser
}

interface CommentUpdatedEvent {
  comment: CommentWithUser
  updatedBy: string
}

interface CommentDeletedEvent {
  commentId: string
  deletedBy: string
}

// Member Events
interface MemberAddedEvent {
  member: MemberWithUser
  addedBy: string
}

interface MemberRemovedEvent {
  memberId: string
  userId: string
  removedBy: string
}

interface MemberRoleChangedEvent {
  memberId: string
  userId: string
  oldRole: MemberRole
  newRole: MemberRole
  changedBy: string
}

// Typing Events
interface TypingEvent {
  taskId: string
  userId: string
}
```
