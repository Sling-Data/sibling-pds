import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ApiResponse, User } from "../types";
import { getUserId } from "../utils/TokenManager";
import { useUserContextNew } from "../contexts";
import { UserService } from "../services/user.service";
import { useAuth } from "./useAuth";

/**
 * Hook for user data and operations
 *
 * This hook combines:
 * - UserContext for state management
 * - UserService for API calls
 * - Navigation for redirects
 *
 * Provides functionality for:
 * - Getting and updating user profile
 * - Checking onboarding status
 * - Managing user state
 */
export function useUser() {
  const {
    user,
    userId,
    loading,
    error,
    hasCompletedOnboarding,
    setUserId,
    setLoading,
    setError,
    setHasCompletedOnboarding,
    updateUserState,
  } = useUserContextNew();

  const { refreshTokens, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  /**
   * Fetch the current user's profile
   */
  const fetchUserProfile = useCallback(async (): Promise<ApiResponse<User>> => {
    setLoading(true);
    setError(null);

    const response = await UserService.getCurrentUser();

    if (response.data) {
      updateUserState({
        user: response.data,
        userId: response.data.id,
        loading: false,
        error: null,
      });
    } else {
      updateUserState({
        loading: false,
        error: response.error,
      });
    }

    return response;
  }, [setLoading, setError, updateUserState]);

  /**
   * Update the current user's profile
   * @param userData The updated user data
   */
  const updateUserProfile = useCallback(
    async (userData: Partial<User>): Promise<ApiResponse<User>> => {
      setLoading(true);
      setError(null);

      const response = await UserService.updateCurrentUser(userData);

      if (response.data) {
        updateUserState({
          user: response.data,
          loading: false,
          error: null,
        });
      } else {
        updateUserState({
          loading: false,
          error: response.error,
        });
      }

      return response;
    },
    [setLoading, setError, updateUserState]
  );

  /**
   * Check if the user has completed the onboarding process
   */
  const checkOnboardingStatus = useCallback(async (): Promise<boolean> => {
    const response = await UserService.hasCompletedOnboarding();

    const hasCompleted = !!response.data?.completed;
    setHasCompletedOnboarding(hasCompleted);

    return hasCompleted;
  }, [setHasCompletedOnboarding]);

  /**
   * Navigate to the appropriate page based on user data and authentication status
   * @param fallbackPath The path to navigate to if the user is not authenticated
   */
  const checkUserDataAndNavigate = useCallback(
    async (fallbackPath: string = "/login") => {
      const currentUserId = getUserId();
      if (!currentUserId) {
        navigate(fallbackPath);
        return;
      }

      // Check if token is valid, refresh if needed
      if (!isAuthenticated) {
        const refreshSuccessful = await refreshTokens();
        if (!refreshSuccessful) {
          navigate(fallbackPath);
          return;
        }
      }

      try {
        // First, fetch user profile
        const userResponse = await fetchUserProfile();

        if (!userResponse.data) {
          navigate(fallbackPath);
          return;
        }

        // Then check onboarding status
        const hasCompletedOnboarding = await checkOnboardingStatus();

        if (!hasCompletedOnboarding) {
          navigate("/onboarding");
          return;
        }

        // Now check user data
        const userDataResponse = await UserService.getUserData(currentUserId);

        if (!userDataResponse.data) {
          navigate("/data-input");
          return;
        }

        // Check if user has volunteered data
        if (
          userDataResponse.data.volunteeredData &&
          userDataResponse.data.volunteeredData.length > 0
        ) {
          // User has volunteered data, navigate to profile
          navigate("/profile");
        } else {
          // User doesn't have volunteered data, navigate to data input
          navigate("/data-input");
        }
      } catch (error) {
        console.error("Error checking user data:", error);
        // If there's an error, default to data input page
        navigate("/data-input");
      }
    },
    [
      fetchUserProfile,
      checkOnboardingStatus,
      navigate,
      isAuthenticated,
      refreshTokens,
    ]
  );

  return {
    user,
    userId,
    loading,
    error,
    hasCompletedOnboarding,
    isAuthenticated,
    fetchUserProfile,
    updateUserProfile,
    checkOnboardingStatus,
    checkUserDataAndNavigate,
    setUserId,
  };
}
