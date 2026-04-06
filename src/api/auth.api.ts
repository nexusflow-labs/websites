import http, { tokenManager } from './http';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from '@/types';

export const authApi = {
  /**
   * Login with email and password
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await http.post<LoginResponse>('/auth/login', data);
    tokenManager.setTokens(response.data.accessToken, response.data.refreshToken);
    return response.data;
  },

  /**
   * Register a new account
   */
  async register(data: RegisterRequest): Promise<void> {
    await http.post('/auth/register', data);
  },

  /**
   * Logout current session
   */
  async logout(): Promise<void> {
    const refreshToken = tokenManager.getRefreshToken();
    if (refreshToken) {
      try {
        await http.post('/auth/logout', { refreshToken });
      } catch {
        // Ignore errors during logout
      }
    }
    tokenManager.clearTokens();
  },

  /**
   * Logout from all devices
   */
  async logoutAll(): Promise<void> {
    await http.post('/auth/logout-all');
    tokenManager.clearTokens();
  },

  /**
   * Request password reset email
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    const response = await http.post<ForgotPasswordResponse>('/auth/forgot-password', data);
    return response.data;
  },

  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    const response = await http.post<ResetPasswordResponse>('/auth/reset-password', data);
    return response.data;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!tokenManager.getAccessToken();
  },
};
