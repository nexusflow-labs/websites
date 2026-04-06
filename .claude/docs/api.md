# NexusFlow API Documentation

## Base Configuration

```typescript
const API_BASE_URL = 'http://localhost:3000'
const WS_URL = 'http://localhost:3000'

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${accessToken}`
}
```

---

## 1. Authentication

### POST /auth/register
Register new account. No auth required. Rate limit: 5/60s.

```typescript
// Request
interface RegisterRequest {
  name: string         // 3-50 chars
  email: string        // valid email
  password: string     // min 8 chars, 1 upper, 1 lower, 1 number, 1 special
  avatar?: string
}
// Response: 201 Created (no body)
// Errors: 400 (invalid), 409 (email exists)
```

### POST /auth/login
Login with email/password. Rate limit: 10/60s.

```typescript
// Request
interface LoginRequest {
  email: string
  password: string
}
// Response: 200
interface LoginResponse {
  accessToken: string
  refreshToken: string
}
// Errors: 401 (invalid credentials)
```

### POST /auth/refresh
Refresh access token. Rate limit: 10/60s.

```typescript
// Request
interface RefreshRequest {
  refreshToken: string
}
// Response: 200
interface RefreshResponse {
  accessToken: string
  refreshToken: string
}
// Errors: 401 (invalid/expired token)
```

### POST /auth/logout
Logout and revoke token. **Auth required**.

```typescript
// Request
interface LogoutRequest {
  refreshToken: string
}
// Response: 204 No Content
```

### POST /auth/logout-all
Logout from all devices. **Auth required**.
```typescript
// Response: 204 No Content
```

### POST /auth/forgot-password
Request password reset email. Rate limit: 3/60s.

```typescript
// Request
interface ForgotPasswordRequest {
  email: string
}
// Response: 200
interface ForgotPasswordResponse {
  message: string  // "If an account exists..."
}
```

### POST /auth/reset-password
Reset password with token. Rate limit: 5/60s.

```typescript
// Request
interface ResetPasswordRequest {
  token: string
  newPassword: string
}
// Response: 200
interface ResetPasswordResponse {
  message: string  // "Password has been reset successfully."
}
// Errors: 400 (invalid/expired token)
```

---

## 2. Workspaces

All endpoints require **Auth**. Member-only endpoints require **WorkspaceMemberGuard**.

### GET /workspaces
List all workspaces user is member of.

```typescript
// Response: 200
interface WorkspaceResponse {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}
type GetWorkspacesResponse = WorkspaceResponse[]
```

### POST /workspaces
Create workspace (user becomes OWNER).

```typescript
// Request
interface CreateWorkspaceRequest {
  name: string          // 3-50 chars
  description?: string  // 0-255 chars
}
// Response: 201 Created - WorkspaceResponse
```

### GET /workspaces/:id
Get workspace by ID. **Member only**.

```typescript
// Response: 200 - WorkspaceResponse
// Errors: 403 (not member), 404 (not found)
```

### PUT /workspaces/:id
Update workspace. **OWNER/ADMIN only**.

```typescript
// Request
interface UpdateWorkspaceRequest {
  name: string
  description?: string
}
// Response: 200 - WorkspaceResponse
// Errors: 403, 404
```

### DELETE /workspaces/:id
Delete workspace. **OWNER only**.

```typescript
// Response: 204 No Content
// Errors: 403, 404
```

---

## 3. Members

All endpoints require **Auth** + **WorkspaceMemberGuard**.

### GET /workspaces/:workspaceId/members
List workspace members.

```typescript
// Response: 200
interface MemberWithUserResponse {
  id: string
  userId: string
  workspaceId: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  user: {
    id: string
    fullName: string
    email: string
    avatar?: string
  }
}
type GetMembersResponse = MemberWithUserResponse[]
```

### POST /workspaces/:workspaceId/members
Add member. **OWNER/ADMIN only**.

```typescript
// Request
interface AddMemberRequest {
  userId: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
}
// Response: 201 Created
interface MemberResponse {
  id: string
  userId: string
  workspaceId: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  createdAt: string
}
```

### PATCH /workspaces/:workspaceId/members/:targetId/role
Update member role. **OWNER/ADMIN only**. Cannot change OWNER role.

```typescript
// Request
interface UpdateRoleRequest {
  operationId: string  // deprecated
  newRole: 'OWNER' | 'ADMIN' | 'MEMBER'
}
// Response: 204 No Content
// Errors: 400 (cannot change OWNER)
```

### DELETE /workspaces/:workspaceId/members/:targetId
Remove member. **OWNER/ADMIN only**. Cannot remove OWNER.

```typescript
// Response: 204 No Content
// Errors: 400 (cannot remove OWNER)
```

---

## 4. Projects

All endpoints require **Auth** + **WorkspaceMemberGuard**.

### GET /workspaces/:workspaceId/projects
List projects with pagination and filters.

```typescript
// Query params
interface ListProjectsQuery {
  page?: number           // default: 1
  pageSize?: number       // default: 20, max: 100
  search?: string         // max 100 chars
  status?: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED'
  ownerId?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'name'  // default: createdAt
  sortDirection?: 'asc' | 'desc'                // default: desc
}

// Response: 200
interface ProjectResponse {
  id: string
  name: string
  description?: string
  status: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED'
  workspaceId: string
  ownerId: string
  createdAt: string
  updatedAt: string
}
type GetProjectsResponse = PaginatedResponse<ProjectResponse>
```

### POST /workspaces/:workspaceId/projects
Create project.

```typescript
// Request
interface CreateProjectRequest {
  name: string          // 2-100 chars
  description?: string  // 0-500 chars
}
// Response: 201 - ProjectResponse
```

### GET /workspaces/:workspaceId/projects/:id
Get project by ID.

### PUT /workspaces/:workspaceId/projects/:id
Update project. **Owner or ADMIN/OWNER role**.

```typescript
// Request
interface UpdateProjectRequest {
  name?: string
  description?: string
  status?: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED'
}
// Response: 200 - ProjectResponse
```

### DELETE /workspaces/:workspaceId/projects/:id
Delete project. **Owner or ADMIN/OWNER role**.

---

## 5. Tasks

All endpoints require **Auth** + **WorkspaceMemberGuard**.

### GET /projects/:projectId/tasks
List tasks with filters.

```typescript
// Query params
interface ListTasksQuery {
  page?: number
  pageSize?: number              // default: 20, max: 100
  status?: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE'
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  assigneeId?: string
  creatorId?: string
  rootOnly?: boolean             // only root tasks (no parent)
  dueDateFrom?: string           // ISO date
  dueDateTo?: string
  createdFrom?: string
  createdTo?: string
  search?: string
  labelIds?: string              // comma-separated UUIDs
  overdue?: boolean
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'title' | 'position'
  sortDirection?: 'asc' | 'desc'
}

// Response: 200
interface TaskResponse {
  id: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: string
  projectId: string
  assigneeId?: string
  creatorId: string
  parentId?: string
  createdAt: string
  updatedAt: string
}
type GetTasksResponse = PaginatedResponse<TaskResponse>
```

### POST /projects/:projectId/tasks
Create task.

```typescript
// Request
interface CreateTaskRequest {
  title: string          // 2-200 chars
  description?: string   // 0-2000 chars
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'  // default: MEDIUM
  dueDate?: string
  parentId?: string      // for subtasks
}
// Response: 201 - TaskResponse
```

### GET /projects/:projectId/tasks/:id
Get task by ID.

### GET /projects/:projectId/tasks/:id/subtasks
Get subtasks of a task.

```typescript
// Response: 200 - TaskResponse[]
```

### PUT /projects/:projectId/tasks/:id
Update task. **Owner or ADMIN/OWNER role**.

```typescript
// Request
interface UpdateTaskRequest {
  title?: string
  description?: string
  status?: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE'
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: string | null
}
// Response: 200 - TaskResponse
```

### PATCH /projects/:projectId/tasks/:id/assign
Assign task to user.

```typescript
// Request
interface AssignTaskRequest {
  assigneeId?: string | null
}
// Response: 200 - TaskResponse
```

### DELETE /projects/:projectId/tasks/:id
Delete task. **Owner or ADMIN/OWNER role**.

---

## 6. Comments

### GET /tasks/:taskId/comments
List comments with pagination.

```typescript
// Query: page, pageSize (default: 20, max: 100)
// Response: 200
interface CommentWithUserResponse {
  id: string
  content: string
  taskId: string
  author: {
    id: string
    fullName: string
    email: string
    avatar?: string
  }
  createdAt: string
  updatedAt: string
}
type GetCommentsResponse = PaginatedResponse<CommentWithUserResponse>
```

### POST /tasks/:taskId/comments
Create comment.

```typescript
// Request
interface CreateCommentRequest {
  content: string  // 1-5000 chars
}
// Response: 201
interface CommentResponse {
  id: string
  content: string
  taskId: string
  authorId: string
  createdAt: string
  updatedAt: string
}
```

### PUT /tasks/:taskId/comments/:id
Update comment. **Author only**.

### DELETE /tasks/:taskId/comments/:id
Delete comment. **Author only**.

---

## 7. Labels

### GET /workspaces/:workspaceId/labels
List workspace labels.

```typescript
// Response: 200
interface LabelResponse {
  id: string
  name: string
  color: string  // hex #RRGGBB
  workspaceId: string
  createdAt: string
}
type GetLabelsResponse = LabelResponse[]
```

### POST /workspaces/:workspaceId/labels
Create label. **OWNER/ADMIN only**.

```typescript
// Request
interface CreateLabelRequest {
  name: string    // 1-50 chars
  color?: string  // hex format
}
// Response: 201 - LabelResponse
```

### PUT /workspaces/:workspaceId/labels/:id
Update label. **OWNER/ADMIN only**.

### DELETE /workspaces/:workspaceId/labels/:id
Delete label. **OWNER/ADMIN only**.

---

## 8. Task Labels

### GET /tasks/:taskId/labels
Get labels attached to task.

```typescript
// Response: 200 - LabelResponse[]
```

### POST /tasks/:taskId/labels/:labelId
Attach label to task.

```typescript
// Response: 201 (no body)
// Errors: 409 (already attached)
```

### DELETE /tasks/:taskId/labels/:labelId
Remove label from task.

---

## 9. Activity Logs

### GET /activity-logs
List activity logs with filters.

```typescript
// Query
interface ListActivityLogsQuery {
  page?: number
  pageSize?: number
  entityType?: 'TASK' | 'PROJECT' | 'WORKSPACE' | 'MEMBER' | 'COMMENT' | 'LABEL'
  entityId?: string
  userId?: string
  action?: 'CREATE' | 'UPDATE' | 'DELETE' | 'ASSIGN' | 'COMMENT' | 'STATUS_CHANGE'
  fromDate?: string
  toDate?: string
}

// Response: 200
interface ActivityLogResponse {
  id: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  entityType: string
  entityId: string
  user: {
    id: string;
    name: string;
    avatar: string;
  }
  metadata?: Record<string, any>
  createdAt: string
}

export type TaskCreateMetadata = {
  title: string
  projectId: string
  parentId?: string | null
}

export type TaskUpdateMetadata =
  | {
      changes: {
        title?: { old: string; new: string }
        description?: { old: string | null; new: string }
        dueDate?: { old: string | null; new: string }
        priority?: { old: 'LOW' | 'MEDIUM' | 'HIGH'; new: 'LOW' | 'MEDIUM' | 'HIGH' }
      }
    }
  | {
      action: 'LABEL_ADDED'
      labelId: string
      labelName: string
    }

export type TaskStatusChangeMetadata = {
  oldStatus: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE'
  newStatus: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE'
}

export type TaskAssignMetadata = {
  assigneeId: string
}

export type TaskCommentMetadata = {
  commentId: string
}

// ================= PROJECT =================
export type ProjectCreateMetadata = {
  name: string
  workspaceId: string
}

export type ProjectUpdateMetadata = {
  changes: Record<string, { old: any; new: any }>
}

// ================= WORKSPACE =================
export type WorkspaceCreateMetadata = {
  name: string
}

export type WorkspaceUpdateMetadata = {
  oldName: string
  newName: string
}

// ================= LABEL =================
export type LabelCreateMetadata = {
  name: string
  color: string
  workspaceId: string
}

export type LabelDeleteMetadata = {
  name: string
  workspaceId: string
}

// ================= COMMENT =================
export type CommentUpdateMetadata = {
  taskId: string
  oldContent: string
  newContent: string
}

type GetActivityLogsResponse = PaginatedResponse<ActivityLogResponse>
```

### GET /activity-logs/tasks/:taskId
### GET /activity-logs/projects/:projectId
### GET /activity-logs/workspaces/:workspaceId

---

## 10. Dashboard

### GET /workspaces/:workspaceId/dashboard
Get workspace statistics.

```typescript
// Response: 200
interface WorkspaceStatisticsResponse {
  workspaceId: string
  totalProjects: number
  totalTasks: number
  totalMembers: number
  tasksByStatus: { status: string; count: number }[]
  tasksByPriority: { priority: string; count: number }[]
  overdueTasks: number
  tasksCompletedThisWeek: number
  tasksCreatedThisWeek: number
  projectStats: {
    projectId: string
    projectName: string
    totalTasks: number
    completedTasks: number
    completionRate: number  // 0-100
  }[]
}
```

---

## 11. File Upload

### POST /files/register
Register file upload, get pre-signed URL.

```typescript
// Request
interface RegisterUploadRequest {
  filename: string       // max 255 chars
  contentType: string    // MIME type
  workspaceId?: string
}
// Response: 201
interface RegisterUploadResponse {
  id: string
  uploadUrl: string
  expiresAt: string
}
```

### POST /files/upload (Local dev only)
Upload file. Query: key, contentType, expires, token. Body: file (binary).

### GET /files/download (Local dev only)
Download file. Query: key, expires, token.

### POST /tasks/:taskId/attachments
Attach uploaded file to task.

```typescript
// Request
interface AttachFileRequest {
  fileId: string
}
// Response: 201
interface FileUploadResponse {
  id: string
  filename: string
  contentType: string
  size?: number
  status: 'REGISTERED' | 'UPLOADED' | 'ATTACHED'
  resourceType?: 'TASK' | 'PROJECT'
  resourceId?: string
  uploadedAt?: string
  attachedAt?: string
  createdAt: string
}
```

### GET /tasks/:taskId/attachments
List task attachments.

### GET /files/:fileId/download
Get download URL.

```typescript
// Response: 200
interface DownloadUrlResponse {
  downloadUrl: string
  filename: string
  contentType: string
  size?: number
  expiresAt: string
}
```

### DELETE /files/:fileId
Delete file.

---

## 12. Notifications

### GET /notifications
List user notifications.

```typescript
// Query
interface ListNotificationsQuery {
  filter?: 'all' | 'unread' | 'read'  // default: all
  cursor?: string
  limit?: number                       // default: 20, max: 100
}

// Response: 200
interface NotificationResponse {
  id: string
  type: 'TASK_ASSIGNED' | 'COMMENT_ADDED' | 'MEMBER_ADDED' | 'MEMBER_REMOVED' | 'TASK_UPDATED'
  entityType: 'TASK' | 'PROJECT' | 'WORKSPACE' | 'MEMBER'
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

interface CursorPaginatedResponse<T> {
  items: T[]
  meta: {
    nextCursor?: string
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}
```

### GET /notifications/unread-count
Get unread count.

```typescript
// Response: 200
interface UnreadCountResponse {
  count: number
}
```

### PATCH /notifications/:id/read
Mark notification as read.

### PATCH /notifications/read-all
Mark all as read.

---

## 13. Invitations

### POST /workspaces/:workspaceId/invitations
Create invitation. **OWNER/ADMIN only**.

```typescript
// Request
interface CreateInvitationRequest {
  email: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
}
// Response: 201
interface InvitationResponse {
  id: string
  email: string
  invitedById: string
  workspaceId: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
  expiresAt: string
  createdAt: string
}
// Errors: 409 (pending invitation exists)
```

### GET /workspaces/:workspaceId/invitations
List pending invitations. **OWNER/ADMIN only**.

### DELETE /workspaces/:workspaceId/invitations/:invitationId
Cancel invitation. **OWNER/ADMIN only**.

### POST /invitations/accept
Accept invitation. **Auth required**.

```typescript
// Request
interface AcceptInvitationRequest {
  token: string
}
// Response: 200 - MemberResponse
```

### POST /invitations/reject
Reject invitation. **Auth required**.

```typescript
// Request
interface RejectInvitationRequest {
  token: string
}
// Response: 204 No Content
```

---

## 14. WebSocket Events

### Connection
```typescript
import { io } from 'socket.io-client'

const socket = io('http://localhost:3000', {
  auth: { token: accessToken }
})
```

### Client Events (emit)
| Event | Payload |
|-------|---------|
| `workspace:join` | `{ workspaceId }` |
| `workspace:leave` | `{ workspaceId }` |
| `project:join` | `{ projectId }` |
| `project:leave` | `{ projectId }` |
| `task:join` | `{ taskId, projectId }` |
| `task:leave` | `{ taskId }` |
| `typing:start` | `{ taskId }` |
| `typing:stop` | `{ taskId }` |

### Server Events (listen)

**Task Events** (project room):
| Event | Payload |
|-------|---------|
| `task:created` | `{ task }` |
| `task:updated` | `{ task, changes, updatedBy }` |
| `task:deleted` | `{ taskId, deletedBy }` |
| `task:assigned` | `{ taskId, assigneeId, previousAssigneeId, assignedBy }` |

**Comment Events** (task room):
| Event | Payload |
|-------|---------|
| `comment:created` | `{ comment }` |
| `comment:updated` | `{ comment, updatedBy }` |
| `comment:deleted` | `{ commentId, deletedBy }` |

**Project Events** (workspace room):
| Event | Payload |
|-------|---------|
| `project:created` | `{ project }` |
| `project:updated` | `{ project, changes, updatedBy }` |
| `project:deleted` | `{ projectId, deletedBy }` |

**Member Events** (workspace + user room):
| Event | Payload |
|-------|---------|
| `member:added` | `{ member, addedBy }` |
| `member:removed` | `{ memberId, userId, removedBy }` |
| `member:role_changed` | `{ memberId, userId, oldRole, newRole, changedBy }` |

**Invitation Events**:
| Event | Payload | Room |
|-------|---------|------|
| `invitation:received` | `{ invitation }` | user |
| `invitation:accepted` | `{ invitation, member }` | workspace |
| `invitation:rejected` | `{ invitation }` | workspace |

**Typing Events** (task room):
| Event | Payload |
|-------|---------|
| `user:typing` | `{ taskId, userId }` |
| `user:stop_typing` | `{ taskId, userId }` |

---

## Shared Types

### Pagination
```typescript
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
```
