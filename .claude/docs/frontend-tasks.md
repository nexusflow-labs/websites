# NexusFlow Frontend Development Tasks

**Total: 74 Tasks**

## Priority Phases
1. **Phase 1** (001-010): Core Setup - Project, routing, auth infrastructure
2. **Phase 2** (011-014): Authentication - Login, register, password reset
3. **Phase 3** (015-024): Workspaces & Members
4. **Phase 4** (025-030): Projects
5. **Phase 5** (031-038): Tasks & Labels
6. **Phase 6** (039-044): Dashboard & Notifications
7. **Phase 7** (045-049): Real-time WebSocket
8. **Phase 8** (050-074): Polish - Profile, search, testing, deploy

---

## Phase 1: Core Setup

### TASK-001: Initialize Nx Workspace with Vue 3
Dependencies: @vueuse/core, pinia, vue-router, axios, socket.io-client, @headlessui/vue, @heroicons/vue. Configure Tailwind, TypeScript strict, ESLint + Prettier.

### TASK-002: Configure Tailwind CSS
Custom colors (primary, success, warning, danger: 50-900), spacing, fonts. Dark mode with `class` strategy.

### TASK-003: Setup Project Structure
```
src/
├── api/           # auth, workspaces, projects, tasks, comments, labels, notifications, files
├── components/    # ui/, layout/, common/
├── composables/
├── pages/
├── router/
├── stores/
├── types/
└── utils/
```

### TASK-004: Create HTTP Client (Axios)
File: `api/http.ts`. Base URL config, request interceptor (auth header), response interceptor (401 refresh), error handling, retry logic.

### TASK-005: Create WebSocket Client
File: `api/socket.ts`. JWT auth, auto-reconnect, event types, room join/leave helpers, connection state.

### TASK-006: Create Auth Store (Pinia)
File: `stores/auth.store.ts`
```typescript
interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}
```
Actions: login, register, logout, refreshToken, forgotPassword, resetPassword.

### TASK-007: Create Router with Guards
Files: `router/index.ts`, `router/guards.ts`
- Public: /login, /register, /forgot-password, /reset-password
- Protected: /, /workspaces/*, /projects/*
- Guards: authGuard, workspaceMemberGuard

### TASK-008: Base UI Components
1. **NxButton** - variants (primary/secondary/danger/ghost), sizes (sm/md/lg), loading, disabled, icons
2. **NxInput** - types, validation states, label, helper, error
3. **NxSelect** - single/multi, searchable, custom render
4. **NxTextarea** - auto-resize, char counter, markdown preview
5. **NxCheckbox / NxRadio**
6. **NxModal** - sizes (sm/md/lg/xl/full), header/body/footer slots
7. **NxDropdown** - menu items, dividers, icons
8. **NxTooltip**
9. **NxAvatar** - sizes (xs-xl), image/initials fallback, status indicator
10. **NxBadge** - variants, dot variant
11. **NxSpinner / NxSkeleton**
12. **NxToast / NxNotification** - types (info/success/warning/error), auto-dismiss

### TASK-009: Form Components
1. **NxFormField** - wrapper with label, error
2. **NxDatePicker**
3. **NxColorPicker** - for labels
4. **NxFileUpload** - drag & drop
5. **NxRichTextEditor** - markdown

### TASK-010: Data Display Components
1. **NxTable** - sorting, pagination
2. **NxPagination**
3. **NxEmptyState**
4. **NxCard**
5. **NxList**
6. **NxTimeline** - activity timeline

---

## Phase 2: Authentication

### TASK-011: Login Page
Route: `/login`. Email/password form, "Remember me", "Forgot password" link, validation, error handling, loading state, redirect after login.

### TASK-012: Register Page
Route: `/register`. Name, email, password form, password strength indicator, confirmation, terms checkbox, success → login redirect.

### TASK-013: Forgot Password Page
Route: `/forgot-password`. Email input, success message, rate limit handling.

### TASK-014: Reset Password Page
Route: `/reset-password?token=xxx`. New password + confirm, token validation, success → login, error handling.

---

## Phase 3: Workspaces & Members

### TASK-015: Workspace List Page
Route: `/workspaces` or `/`. Grid/list view, create button, workspace card (name, description, member count, actions), empty state.

### TASK-016: Create Workspace Modal
Name input (required), description textarea, validation, loading, success → navigate.

### TASK-017: Workspace Settings Page
Route: `/workspaces/:workspaceId/settings`
Tabs: General, Members (→020), Invitations (→024), Labels (→037), Danger Zone (OWNER only).

### TASK-018: Workspace Layout
Route: `/workspaces/:workspaceId/*`. Sidebar (Dashboard, Projects, Members, Settings), header (name, search, notifications, user menu), main content.

### TASK-019: Workspace Store
File: `stores/workspace.store.ts`
```typescript
interface WorkspaceState {
  currentWorkspace: Workspace | null
  members: MemberWithUser[]
  userRole: MemberRole | null
  isLoading: boolean
}
```
Getters: isOwner, isAdmin, isMember, canManageMembers, canManageLabels, canDeleteWorkspace.

### TASK-020: Members List Page
Route: `/workspaces/:workspaceId/members`. Table (avatar, name, email, role badge, actions), invite button (OWNER/ADMIN), search, role dropdown (cannot change OWNER), remove confirmation.

### TASK-021: Invite Member Modal
Email input, role select (ADMIN/MEMBER), send invitation, show pending.

### TASK-022: Role Change Confirmation
Warning message, confirm/cancel.

### TASK-023: Remove Member Confirmation
Warning, member name, confirm/cancel.

### TASK-024: Invitations Management
Location: Settings > Invitations. List pending (email, role, invited by, expires), cancel button.

---

## Phase 4: Projects

### TASK-025: Projects Store
File: `stores/projects.store.ts`
```typescript
interface ProjectsState {
  projects: Project[]
  currentProject: Project | null
  pagination: PaginationMeta
  filters: ProjectFilters
  isLoading: boolean
}
```
Actions: fetchProjects, createProject, updateProject, deleteProject.

### TASK-026: Projects List Page
Route: `/workspaces/:workspaceId/projects`. Grid/list toggle, search, status filter, sort, pagination, create button, project card (name, description, status, progress, owner, actions).

### TASK-027: Create Project Modal
Name (required), description, validation, loading.

### TASK-028: Project Detail / Board View
Route: `/workspaces/:workspaceId/projects/:projectId`. Kanban board (TODO, IN_PROGRESS, IN_REVIEW, DONE), drag & drop, task card (title, priority, labels, assignee, due date, subtask count), add task per column, filters (assignee, priority, labels, due date, search).

### TASK-029: Project List View
Route: `?view=list`. Table (title, status, priority, assignee, due date, labels), inline status change, sort by column.

### TASK-030: Project Settings Modal
Update name/description, change status (Archive, Complete), delete with confirmation.

---

## Phase 5: Tasks & Labels

### TASK-031: Tasks Store
File: `stores/tasks.store.ts`
```typescript
interface TasksState {
  tasks: Task[]
  tasksByStatus: Record<TaskStatus, Task[]>
  currentTask: TaskDetail | null
  pagination: PaginationMeta
  filters: TaskFilters
  isLoading: boolean
}
```

### TASK-032: Create Task Modal
Title (required), description (markdown), priority select, due date, assignee, labels multi-select, parent task (subtask), quick create (Enter) vs full create.

### TASK-033: Task Detail Drawer/Modal
Full-width drawer. Sections: header (editable title), status/priority/assignee dropdowns, due date, labels, description (markdown editor), subtasks, comments, attachments, activity log. Real-time updates, delete button.

### TASK-034: Task Comments Section
Location: Task Detail. Comments list (author, content, timestamp, edit/delete own), add form, markdown, real-time, typing indicator.

### TASK-035: Task Attachments Section
Location: Task Detail. Upload zone (drag & drop), file list (icon, name, size, date, download, delete), progress indicator.

### TASK-036: Subtasks Section
Location: Task Detail. Subtasks (checkbox, title, assignee, actions), add input, progress indicator (X/Y completed).

### TASK-037: Labels Management Page
Route: `/workspaces/:workspaceId/settings/labels`. Labels list (color, name, usage count, edit/delete), create form (name, color picker), inline edit, delete confirmation.

### TASK-038: Labels Picker Component
Dropdown, multi-select, color preview, search/filter, quick create.

---

## Phase 6: Dashboard & Notifications

### TASK-039: Dashboard Page
Route: `/workspaces/:workspaceId/dashboard`
Widgets:
1. Summary cards (projects, tasks, members, overdue)
2. Tasks by Status (pie/donut)
3. Tasks by Priority (bar)
4. Weekly Activity (created, completed)
5. Project Progress (table, progress bars)
6. Recent Activity (timeline, last 10)

### TASK-040: Notifications Store
File: `stores/notifications.store.ts`
```typescript
interface NotificationsState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
}
```
WebSocket integration.

### TASK-041: Notifications Dropdown
Location: Header. Bell icon + badge, panel (mark all read, list, type icon, title, timestamp, unread indicator, load more, view all link).

### TASK-042: Notifications Page
Route: `/notifications`. Filter tabs (All, Unread, Read), list, mark as read, link to entity.

### TASK-043: Activity Timeline Component
Timeline layout, item (action icon, user avatar, description, timestamp), filter by type, pagination/infinite scroll.

### TASK-044: Workspace Activity Page
Route: `/workspaces/:workspaceId/activity`. Full timeline, filters (entity type, user, date range, action type).

---

## Phase 7: Real-time Features

### TASK-045: WebSocket Integration
File: `composables/useWebSocket.ts`. Auto-connect when authenticated, room management (workspace, project, task), event handlers (update stores, toast notifications, typing indicators).

### TASK-046: Real-time Task Updates
Events: task:created, task:updated, task:deleted, task:assigned. Add/update/remove from board, toast notification, update if current user.

### TASK-047: Real-time Comments
Events: comment:created, comment:updated, comment:deleted. Add/update/remove, scroll to new, typing indicator.

### TASK-048: Real-time Members
Events: member:added, member:removed, member:role_changed. Update list, update current user role, handle removal (redirect).

### TASK-049: Typing Indicators
Events: user:typing, user:stop_typing. Show "User is typing...", auto-timeout 5s, multiple users.

---

## Phase 8: Polish

### TASK-050: User Menu Component
Avatar + name, dropdown (Profile, Settings, Switch workspace, Logout).

### TASK-051: User Profile Page
Route: `/profile`. Avatar upload, name edit, email display, change password.

### TASK-052: User Settings Page
Route: `/settings`. Notification preferences, theme (light/dark).

### TASK-053: Invitation Email Handler
Route: `/invitations/accept?token=xxx`. Validate token, if auth → accept/reject UI, if not → login redirect, accept → workspace, reject → home.

### TASK-054: Pending Invitations Banner
Location: Dashboard/header. Show count, click to view/accept/reject, dismiss.

### TASK-055: Global Search
Location: Header. Input + Cmd+K, search tasks/projects/members, results dropdown, navigate.

### TASK-056: Breadcrumb Navigation
Auto-generate from route, clickable, truncate long names.

### TASK-057: Error Boundary Component
Catch render errors, friendly page, "Try again", report link.

### TASK-058: Loading States
Page/list/card skeleton, button loading, full page loader.

### TASK-059: Empty States
No workspaces/projects/tasks/comments/notifications/search results.

### TASK-060: 404 Page
Route: `*`. Friendly message, home link, search suggestion.

### TASK-061: Lazy Loading Routes
```typescript
const WorkspacePage = () => import('./pages/WorkspacePage.vue')
```

### TASK-062: Virtual Scrolling
Task list, comments, activity logs, members list.

### TASK-063: Debounced Search
Global search, task filter, project filter.

### TASK-064: Optimistic Updates
Task status change, comment create, task assign.

### TASK-065: Unit Tests Setup
Vitest config, test utilities, mock factories.

### TASK-066: Component Tests
UI components, form components, store actions.

### TASK-067: E2E Tests Setup
Playwright config, test helpers, auth fixtures.

### TASK-068: E2E Test Scenarios
Login flow, create workspace/project, task management, comments, members.

### TASK-069: Keyboard Navigation
Tab, Escape for modals, arrow keys, shortcuts (Cmd+K).

### TASK-070: Screen Reader Support
Semantic HTML, ARIA labels, focus management, live regions.

### TASK-071: Color Contrast
WCAG AA, dark mode, focus indicators.

### TASK-072: Build Configuration
Env variables, bundle optimization, source maps, CDN.

### TASK-073: Docker Setup
Dockerfile, nginx.conf, .dockerignore.

### TASK-074: CI/CD Pipeline
GitHub Actions: lint, type check, unit tests, build, E2E, deploy staging, deploy prod.
