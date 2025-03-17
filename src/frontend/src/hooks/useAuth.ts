import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AuthTokens,
  LoginCredentials,
  SignupCredentials,
  ApiResponse,
} from "../types";
import { useApi } from "./useApi";
import {
  getAccessToken,
  getRefreshToken,
  clearTokens,
  storeTokens,
  getUserId,
} from "../utils/TokenManager";
import { useNotificationContext } from "../contexts";

interface AuthState {
  isAuthenticated: boolean;
  isInitialized: boolean;
  userId: string | null;
}

/**
 * Hook for authentication state and operations
 *
 * Provides functionality for:
 * - Login and signup
 * - Checking authentication status
 * - Logging out
 * - Refreshing tokens
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: !!getAccessToken(),
    isInitialized: false,
    userId: getUserId(),
  });

  const navigate = useNavigate();
  const { addNotification } = useNotificationContext();
  const { request } = useApi();

  // Initialize the auth state
  useEffect(() => {
    const initializeAuth = async () => {
      const hasToken = !!getAccessToken();

      setState({
        isAuthenticated: hasToken,
        isInitialized: true,
        userId: getUserId(),
      });
    };

    initializeAuth();
  }, []);

  /**
   * Log in a user
   * @param credentials The login credentials
   * @returns A promise that resolves to the authentication result
   */
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<ApiResponse<AuthTokens>> => {
      const response = await request<AuthTokens>("/auth/login", {
        method: "POST",
        body: credentials,
        requiresAuth: false,
        showSuccessNotification: true,
        successMessage: "Login successful!",
      });

      if (response.data) {
        storeTokens(response.data);
        setState({
          isAuthenticated: true,
          isInitialized: true,
          userId: getUserId(),
        });
      }

      return response;
    },
    [request]
  );

  /**
   * Sign up a new user
   * @param credentials The signup credentials
   * @returns A promise that resolves to the authentication result
   */
  const signup = useCallback(
    async (
      credentials: SignupCredentials
    ): Promise<ApiResponse<AuthTokens>> => {
      const response = await request<AuthTokens>("/auth/signup", {
        method: "POST",
        body: credentials,
        requiresAuth: false,
        showSuccessNotification: true,
        successMessage: "Account created successfully!",
      });

      if (response.data) {
        storeTokens(response.data);
        setState({
          isAuthenticated: true,
          isInitialized: true,
          userId: getUserId(),
        });
      }

      return response;
    },
    [request]
  );

  /**
   * Log out the current user
   */
  const logout = useCallback(() => {
    clearTokens();
    setState({
      isAuthenticated: false,
      isInitialized: true,
      userId: null,
    });
    addNotification("You have been logged out", "info");
    navigate("/login");
  }, [addNotification, navigate]);

  /**
   * Refresh the authentication tokens
   * @returns A promise that resolves to a boolean indicating if the refresh was successful
   */
  const refreshTokens = useCallback(async (): Promise<boolean> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await request<AuthTokens>("/auth/refresh-token", {
        method: "POST",
        body: { refreshToken },
        requiresAuth: false,
        showErrorNotification: false,
      });

      if (response.data) {
        storeTokens(response.data);
        setState((prev) => ({
          ...prev,
          isAuthenticated: true,
        }));
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }, [request]);

  /**
   * Check if the user is authenticated
   * If not, redirect to the login page
   * @param redirectPath The path to redirect to if the user is not authenticated
   * @returns A boolean indicating if the user is authenticated
   */
  const checkAuth = useCallback(
    (redirectPath: string = "/login"): boolean => {
      const isAuth = !!getAccessToken();

      if (!isAuth) {
        navigate(redirectPath);
        addNotification("Please login to continue", "info");
      }

      return isAuth;
    },
    [navigate, addNotification]
  );

  return {
    ...state,
    login,
    signup,
    logout,
    refreshTokens,
    checkAuth,
  };
}
