import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Guard that requires authentication
 * Redirects to login if not authenticated
 */
export function authGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
): void {
  const authStore = useAuthStore();
  console.log('Auth guard check, isAuthenticated:', authStore.isAuthenticated);

  if (!authStore.isAuthenticated) {
    // Save the intended destination for redirect after login
    next({
      path: '/login',
      query: { redirect: to.fullPath },
    });
  } else {
    next();
  }
}

/**
 * Guard that redirects authenticated users away from auth pages
 * Use on login, register, etc.
 */
export function guestGuard(
  _to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
): void {
  const authStore = useAuthStore();
  console.log('Auth guard check, isAuthenticated:', authStore.isAuthenticated);

  if (authStore.isAuthenticated) {
    next({ path: '/' });
  } else {
    next();
  }
}

/**
 * Guard that requires workspace membership
 * Should be used after authGuard
 */
export async function workspaceMemberGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
): Promise<void> {
  const workspaceId = to.params.workspaceId as string;

  if (!workspaceId) {
    next();
    return;
  }

  // TODO: Implement workspace membership check
  // For now, just pass through - will be implemented when workspace store is ready
  next();
}
