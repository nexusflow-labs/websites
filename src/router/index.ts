import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { authGuard, guestGuard } from './guards';

// Lazy load pages
const LoginPage = () => import('@/pages/auth/LoginPage.vue');
const RegisterPage = () => import('@/pages/auth/RegisterPage.vue');
const ForgotPasswordPage = () => import('@/pages/auth/ForgotPasswordPage.vue');
const ResetPasswordPage = () => import('@/pages/auth/ResetPasswordPage.vue');
const HomePage = () => import('@/pages/HomePage.vue');
const NotFoundPage = () => import('@/pages/NotFoundPage.vue');

const routes: RouteRecordRaw[] = [
  // Public routes (guest only)
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    beforeEnter: guestGuard,
    meta: { title: 'Login' },
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterPage,
    beforeEnter: guestGuard,
    meta: { title: 'Register' },
  },
  {
    path: '/forgot-password',
    name: 'forgotPassword',
    component: ForgotPasswordPage,
    beforeEnter: guestGuard,
    meta: { title: 'Forgot Password' },
  },
  {
    path: '/reset-password',
    name: 'resetPassword',
    component: ResetPasswordPage,
    beforeEnter: guestGuard,
    meta: { title: 'Reset Password' },
  },

  // Protected routes
  {
    path: '/',
    name: 'home',
    component: HomePage,
    beforeEnter: authGuard,
    meta: { title: 'Home', requiresAuth: true },
  },

  // Workspace routes (to be expanded)
  {
    path: '/workspaces/:workspaceId',
    beforeEnter: authGuard,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'workspace',
        redirect: (to) => ({ name: 'workspaceDashboard', params: to.params }),
      },
      {
        path: 'dashboard',
        name: 'workspaceDashboard',
        component: () => import('@/pages/workspace/DashboardPage.vue'),
        meta: { title: 'Dashboard' },
      },
      {
        path: 'projects',
        name: 'workspaceProjects',
        component: () => import('@/pages/workspace/ProjectsPage.vue'),
        meta: { title: 'Projects' },
      },
      {
        path: 'projects/:projectId',
        name: 'project',
        component: () => import('@/pages/project/ProjectPage.vue'),
        meta: { title: 'Project' },
      },
      {
        path: 'members',
        name: 'workspaceMembers',
        component: () => import('@/pages/workspace/MembersPage.vue'),
        meta: { title: 'Members' },
      },
      {
        path: 'settings',
        name: 'workspaceSettings',
        component: () => import('@/pages/workspace/SettingsPage.vue'),
        meta: { title: 'Settings' },
      },
      {
        path: 'labels',
        name: 'workspaceLabels',
        component: () => import('@/pages/workspace/LabelsPage.vue'),
        meta: { title: 'Labels' },
      },
      {
        path: 'activity',
        name: 'workspaceActivity',
        component: () => import('@/pages/workspace/ActivityLogsPage.vue'),
        meta: { title: 'Activity Logs' },
      },
    ],
  },

  // User settings
  {
    path: '/settings',
    name: 'userSettings',
    component: () => import('@/pages/user/SettingsPage.vue'),
    beforeEnter: authGuard,
    meta: { title: 'Settings', requiresAuth: true },
  },

  // Notifications
  {
    path: '/notifications',
    name: 'notifications',
    component: () => import('@/pages/NotificationsPage.vue'),
    beforeEnter: authGuard,
    meta: { title: 'Notifications', requiresAuth: true },
  },

  // Invitation handling
  {
    path: '/invitations/accept',
    name: 'acceptInvitation',
    component: () => import('@/pages/InvitationPage.vue'),
    meta: { title: 'Accept Invitation' },
  },

  // 404 catch-all
  {
    path: '/:pathMatch(.*)*',
    name: 'notFound',
    component: NotFoundPage,
    meta: { title: 'Page Not Found' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    return { top: 0 };
  },
});

// Update document title on navigation
router.beforeEach((to, _from, next) => {
  const appName = import.meta.env.VITE_APP_NAME || 'NexusFlow';
  const title = to.meta.title as string | undefined;
  document.title = title ? `${title} | ${appName}` : appName;
  next();
});

export default router;
