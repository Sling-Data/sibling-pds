import { ApiService } from "./api.service";
import { User, ApiResponse } from "../types";
import { getUserId } from "../utils/TokenManager";

/**
 * Service for handling user-related API calls
 *
 * TODO: Backend task - Create /users/me endpoints for easier access to current user data
 * - GET /users/me - Get current user profile
 * - PUT /users/me - Update current user profile
 * - GET /users/me/onboarding - Check if user has completed onboarding
 */
export class UserService extends ApiService {
  /**
   * Get the current user's profile
   * @returns A promise that resolves to the user profile
   */
  public static async getCurrentUser(): Promise<ApiResponse<User>> {
    const userId = getUserId();
    if (!userId) {
      return { data: null, error: "User not authenticated" };
    }
    return this.get<User>(`/users/${userId}`);
  }

  /**
   * Update the current user's profile
   * @param userData The updated user data
   * @returns A promise that resolves to the updated user profile
   */
  public static async updateCurrentUser(
    userData: Partial<User>
  ): Promise<ApiResponse<User>> {
    const userId = getUserId();
    if (!userId) {
      return { data: null, error: "User not authenticated" };
    }
    return this.put<User>(`/users/${userId}`, userData);
  }

  /**
   * Check if the current user has completed the onboarding process
   * This is a placeholder until the backend implements this endpoint
   * @returns A promise that resolves to a boolean indicating if the user has completed onboarding
   */
  public static async hasCompletedOnboarding(): Promise<
    ApiResponse<{ completed: boolean }>
  > {
    // For now, we'll consider a user has completed onboarding if they have a profile
    const response = await this.getCurrentUser();

    if (response.error) {
      return { data: null, error: response.error };
    }

    // If we have user data, consider onboarding complete
    // This is a temporary solution until the backend implements a proper endpoint
    return {
      data: { completed: !!response.data },
      error: null,
    };
  }
}
