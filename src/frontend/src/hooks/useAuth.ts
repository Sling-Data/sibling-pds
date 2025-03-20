import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AuthTokens,
  LoginCredentials,
  SignupCredentials,
  ApiResponse,
} from "../types";
import {
  getAccessToken,
  getUserId,
  isTokenValid,
  shouldRefresh,
} from "../utils/TokenManager";
import { useNotificationContext, useUserContext } from "../contexts";
import { useAuthContext } from "../contexts/AuthContext";
import { AuthService } from "../services/auth.service";
import { UserService } from "../services/user.service";

/**
 * Hook for authentication operations
 *
 * This hook combines:
 * - AuthContext for state management
 * - AuthService for API calls
 * - Navigation for redirects
 *
 * Provides functionality for:
 * - Login and signup
 * - Checking authentication status
 * - Logging out
 * - Refreshing tokens
 * - Smart navigation based on user data
 */
export function useAuth() {
  const {
    isAuthenticated,
    isInitialized,
    userId,
    isRefreshing,
    storeAuthTokens,
    clearAuthTokens,
    setIsRefreshing,
    getCurrentRefreshToken,
    handleTokenRefreshSuccess,
    handleTokenRefreshFailure,
    needsTokenRefresh,
    setAuthState,
  } = useAuthContext();

  const { setUserId } = useUserContext();

  const navigate = useNavigate();
  const { addNotification } = useNotificationContext();

  /**
   * Log in a user
   * @param credentials The login credentials
   * @returns A promise that resolves to the authentication result
   */
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<ApiResponse<AuthTokens>> => {
      const response = await AuthService.login(credentials);

      if (response.data) {
        storeAuthTokens(response.data);
        // Update the state immediately
        const userId = getUserId();
        setUserId(userId);
        setAuthState({
          isAuthenticated: true,
          userId: userId,
        });
      }

      return response;
    },
    [storeAuthTokens, setUserId, setAuthState]
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
      const response = await AuthService.signup(credentials);

      if (response.data) {
        storeAuthTokens(response.data);
      }

      return response;
    },
    [storeAuthTokens]
  );

  /**
   * Log out the current user
   */
  const logout = useCallback(() => {
    clearAuthTokens();
    addNotification("You have been logged out", "info");
    navigate("/login");
  }, [addNotification, navigate, clearAuthTokens]);

  /**
   * Refresh the authentication tokens
   * @returns A promise that resolves to a boolean indicating if the refresh was successful
   */
  const refreshTokens = useCallback(async (): Promise<boolean> => {
    // Prevent multiple simultaneous refresh attempts
    if (isRefreshing) {
      return true; // Another refresh is already in progress
    }

    const refreshToken = getCurrentRefreshToken();
    if (!refreshToken) {
      return false;
    }

    // Check if token should be refreshed (less than 30 seconds remaining)
    if (!shouldRefresh()) {
      return true; // Token is still valid, no need to refresh
    }

    setIsRefreshing(true);

    try {
      const response = await AuthService.refreshTokens(refreshToken);

      if (response.data) {
        handleTokenRefreshSuccess(response.data);
        return true;
      }

      handleTokenRefreshFailure();
      return false;
    } catch (error) {
      handleTokenRefreshFailure();
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [
    isRefreshing,
    getCurrentRefreshToken,
    setIsRefreshing,
    handleTokenRefreshSuccess,
    handleTokenRefreshFailure,
  ]);

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

  /**
   * Check if user has volunteered data and navigate accordingly
   * This preserves the functionality from UserContext
   */
  const checkUserDataAndNavigate = useCallback(async () => {
    const currentUserId = getUserId();
    if (!currentUserId) {
      navigate("/login");
      return;
    }

    // Check if token is valid before making the request
    if (!isTokenValid()) {
      // Try to refresh the token first
      const refreshSuccessful = await refreshTokens();
      if (!refreshSuccessful) {
        // If refresh failed, redirect to login
        navigate("/login");
        return;
      }
    }

    try {
      // Use UserService to fetch user data
      const response = await UserService.getUserData(currentUserId);
      if (!response.data) {
        throw new Error("Failed to fetch user data");
      }

      const data = response.data;

      console.log("data", {
        volunteeredData: data.volunteeredData,
        hasVolunteeredData:
          data.volunteeredData && data.volunteeredData.length > 0,
      });

      // Check if user has volunteered data
      if (data.volunteeredData && data.volunteeredData.length > 0) {
        // User has volunteered data, navigate to profile
        console.log("navigating to profile");
        navigate("/profile");
      } else {
        // User doesn't have volunteered data, navigate to data input
        console.log("navigating to data input");
        navigate("/data-input");
      }
    } catch (error) {
      console.error("Error checking user data:", error);
      // If there's an error, default to data input page
      navigate("/data-input");
    }
  }, [navigate, refreshTokens]);

  // Initialize and set up automatic token refresh
  useEffect(() => {
    const initializeAuth = async () => {
      const hasToken = !!getAccessToken();
      if (hasToken && needsTokenRefresh()) {
        // Try to refresh the token if needed
        await refreshTokens();
      }
    };

    initializeAuth();

    // Set up interval to check token validity and refresh if needed
    const intervalId = setInterval(() => {
      if (needsTokenRefresh()) {
        refreshTokens();
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(intervalId);
  }, [refreshTokens, needsTokenRefresh]);

  return {
    isAuthenticated,
    isInitialized,
    userId,
    login,
    signup,
    logout,
    refreshTokens,
    checkAuth,
    checkUserDataAndNavigate,
  };
}
