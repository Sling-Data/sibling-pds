import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiResponse, User } from "../types";
import { getUserId } from "../utils/TokenManager";
import { useApi } from "./useApi";

interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
  hasCompletedOnboarding: boolean;
}

/**
 * Hook for user data and operations
 *
 * Provides functionality for:
 * - Getting and updating user profile
 * - Checking onboarding status
 * - Managing user state
 */
export function useUser() {
  const [state, setState] = useState<UserState>({
    user: null,
    loading: false,
    error: null,
    hasCompletedOnboarding: false,
  });

  const { request } = useApi();
  const navigate = useNavigate();

  /**
   * Fetch the current user's profile
   */
  const fetchUserProfile = useCallback(async (): Promise<ApiResponse<User>> => {
    const userId = getUserId();
    if (!userId) {
      return { data: null, error: "User not authenticated" };
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    const response = await request<User>(`/users/${userId}`, {
      method: "GET",
      showErrorNotification: false,
    });

    if (response.data) {
      setState((prev) => ({
        ...prev,
        user: response.data,
        loading: false,
        error: null,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: response.error,
      }));
    }

    return response;
  }, [request]);

  /**
   * Update the current user's profile
   * @param userData The updated user data
   */
  const updateUserProfile = useCallback(
    async (userData: Partial<User>): Promise<ApiResponse<User>> => {
      const userId = getUserId();
      if (!userId) {
        return { data: null, error: "User not authenticated" };
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await request<User>(`/users/${userId}`, {
        method: "PUT",
        body: userData,
        showSuccessNotification: true,
        successMessage: "Profile updated successfully!",
      });

      if (response.data) {
        setState((prev) => ({
          ...prev,
          user: response.data,
          loading: false,
          error: null,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: response.error,
        }));
      }

      return response;
    },
    [request]
  );

  /**
   * Check if the user has completed the onboarding process
   */
  const checkOnboardingStatus = useCallback(async (): Promise<boolean> => {
    const userId = getUserId();
    if (!userId) {
      return false;
    }

    const response = await request<{ completed: boolean }>(
      `/users/${userId}/onboarding`,
      {
        method: "GET",
        showErrorNotification: false,
      }
    );

    const hasCompleted = !!response.data?.completed;

    setState((prev) => ({
      ...prev,
      hasCompletedOnboarding: hasCompleted,
    }));

    return hasCompleted;
  }, [request]);

  /**
   * Navigate to the appropriate page based on user data and authentication status
   * @param fallbackPath The path to navigate to if the user is not authenticated
   */
  const checkUserDataAndNavigate = useCallback(
    async (fallbackPath: string = "/login") => {
      const userId = getUserId();

      if (!userId) {
        navigate(fallbackPath);
        return;
      }

      const userResponse = await fetchUserProfile();

      if (!userResponse.data) {
        navigate(fallbackPath);
        return;
      }

      const hasCompletedOnboarding = await checkOnboardingStatus();

      if (!hasCompletedOnboarding) {
        navigate("/onboarding");
        return;
      }

      navigate("/dashboard");
    },
    [fetchUserProfile, checkOnboardingStatus, navigate]
  );

  /**
   * Set the user ID (only for testing or special cases)
   * @param userId The user ID to set
   */
  const setUserId = useCallback((userId: string) => {
    setState((prev) => ({
      ...prev,
      user: prev.user ? { ...prev.user, id: userId } : null,
    }));
  }, []);

  return {
    ...state,
    fetchUserProfile,
    updateUserProfile,
    checkOnboardingStatus,
    checkUserDataAndNavigate,
    setUserId,
  };
}
