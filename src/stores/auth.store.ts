import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from '@/api/auth.api';
import { tokenManager, getErrorMessage } from '@/api/http';
import { connect, disconnect } from '@/api/socket';
import type { User, LoginRequest, RegisterRequest } from '@/types';

interface JwtPayload {
  sub: string;
  email: string;
  fullName: string;
  avatar?: string;
  exp: number;
  iat: number;
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

function extractUserFromToken(token: string | null): User | null {
  if (!token) return null;
  const payload = decodeJwt(token);
  if (!payload) return null;
  return {
    id: payload.sub,
    email: payload.email,
    fullName: payload.fullName,
    avatar: payload.avatar,
  };
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const _accessToken = ref<string | null>(tokenManager.getAccessToken());
  const user = ref<User | null>(extractUserFromToken(_accessToken.value));
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const isAuthenticated = computed(() => !!_accessToken.value);
  const accessToken = computed(() => tokenManager.getAccessToken());
  const refreshToken = computed(() => tokenManager.getRefreshToken());

  // Actions
  async function login(credentials: LoginRequest): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      await authApi.login(credentials);
      _accessToken.value = tokenManager.getAccessToken();
      user.value = extractUserFromToken(_accessToken.value);
      connect();
    } catch (err) {
      error.value = getErrorMessage(err);
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  }

  async function register(data: RegisterRequest): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      await authApi.register(data);
    } catch (err) {
      error.value = getErrorMessage(err);
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  }

  async function logout(): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      // Disconnect WebSocket
      disconnect();
      // Clear state
      _accessToken.value = null;
      user.value = null;
      isLoading.value = false;
    }
  }

  async function logoutAll(): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      await authApi.logoutAll();
    } catch (err) {
      error.value = getErrorMessage(err);
    } finally {
      disconnect();
      _accessToken.value = null;
      user.value = null;
      isLoading.value = false;
    }
  }

  async function forgotPassword(email: string): Promise<string> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await authApi.forgotPassword({ email });
      return response.message;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  }

  async function resetPassword(token: string, newPassword: string): Promise<string> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await authApi.resetPassword({ token, newPassword });
      return response.message;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  }

  function setUser(userData: User | null): void {
    user.value = userData;
  }

  function clearError(): void {
    error.value = null;
  }

  // Initialize - check if we have a token and try to connect
  function initialize(): void {
    if (isAuthenticated.value) {
      // Ensure user is populated from token
      if (!user.value) {
        user.value = extractUserFromToken(_accessToken.value);
      }
      connect();
    }
  }

  return {
    // State
    user,
    isLoading,
    error,

    // Getters
    isAuthenticated,
    accessToken,
    refreshToken,

    // Actions
    login,
    register,
    logout,
    logoutAll,
    forgotPassword,
    resetPassword,
    setUser,
    clearError,
    initialize,
  };
});
